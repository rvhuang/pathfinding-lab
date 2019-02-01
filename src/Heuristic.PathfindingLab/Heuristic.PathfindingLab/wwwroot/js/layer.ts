
abstract class Layer {
    public readonly element: SVGGElement;
    public readonly tileWidth: number; // unit: px
    public readonly tileHeight: number; // unit: px
    public readonly mapWidth: number; // unit: tile
    public readonly mapHeight: number; //  unit: tile

    constructor(element: SVGGElement, tileWidth: number, tileHeight: number, mapWidth: number, mapHeight: number) {
        this.element = element;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
    }
}

class CursorLayer extends Layer { 
    private readonly cursor: SVGRectElement;
    
    private anchors: Array<AnchorTile>;
    private cursorX: number = 0;
    private cursorY: number = 0;

    public readonly histories: Array<PathfindingHistory>;

    public showDetailDescription: (tile: SolutionTile) => any;

    constructor(element: SVGGElement, cursor: SVGRectElement, tileWidth: number, tileHeight: number, mapWidth: number, mapHeight: number) {
        super(element, tileWidth, tileHeight, mapWidth, mapHeight);

        this.anchors = new Array<AnchorTile>();
        this.histories = new Array<PathfindingHistory>();
        this.cursor = cursor;
        this.element.parentElement.addEventListener("mousemove", e => this.onLayerMouseMove(e));
        this.element.parentElement.addEventListener("mouseleave", e => this.onLayerMouseLeave(e));
        this.element.parentElement.addEventListener("mouseenter", e => this.onLayerMouseEnter(e));
    }

    private onLayerMouseMove(event: MouseEvent) {
        var rect = this.element.parentElement.getBoundingClientRect();
        var mouseX = Math.floor((event.clientX - rect.left) / this.tileWidth);
        var mouseY = Math.floor((event.clientY - rect.top) / this.tileHeight);
    
        if (this.cursorX != mouseX) {
            this.cursor.x.baseVal.value = mouseX * this.tileWidth;
            this.cursorX = mouseX;
        }
        if (this.cursorY != mouseY) {
            this.cursor.y.baseVal.value = mouseY * this.tileHeight;
            this.cursorY = mouseY;
        }
    }

    private onLayerMouseLeave(event: MouseEvent) {
        this.cursor.style.visibility = "hidden";
    }

    private onLayerMouseEnter(event: MouseEvent) {
        this.cursor.style.visibility = "inherit"; 
    }

    public togglePath(index: number): boolean {
        var history = this.histories[index];
        if (history == null) return;

        history.isVisible = !history.isVisible;

        if (history.isVisible) {
            var begin = 0.3;
            var tileElement = null as SVGElement;
            var callback = this.showDetailDescription;
                
            for (let step of history.path) {
                tileElement = step.visualize(this.tileWidth, this.tileHeight);
                step.updateAnimation(begin);
                
                if (callback != null) {
                    tileElement.onmousemove = function (ev) {
                        callback(step);
                    };
                }
                this.element.appendChild(tileElement);
                begin += 0.1;
            }
            for (let tile of history.unvisited) {
                var filtered = history.path.filter(p => p.x === tile.x && p.y === tile.y);
                if (filtered.length > 0) {
                    tile.levels.forEach(level => filtered[0].updateLevels(level));
                }
                else {
                    tileElement = tile.visualize(this.tileWidth, this.tileHeight);
                    if (callback != null) {
                        tileElement.onmousemove = function (ev) {
                            callback(tile);
                        };
                    }
                    this.element.appendChild(tileElement);
                }
            }
        }
        else {
            history.path.forEach(p => p.remove());
            history.unvisited.forEach(d => d.remove());
        }
        return history.isVisible;
    }

    public placeTile(x: number, y: number, color: string) {
        if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) {
            return;
        }
        let filtered = this.anchors.filter(a => a.x === x && a.y === y);
        
        if (filtered.length > 0) {
            filtered[0].updateColor(color);
        }
        else {
            var anchor = new AnchorTile(x, y, color);

            this.element.appendChild(anchor.visualize(this.tileWidth, this.tileHeight));
            this.anchors.push(anchor);
        }
    }

    public removeTile(x: number, y: number) {
        if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) {
            return;
        }
        this.anchors.filter(a => a.x === x && a.y === y).forEach(a => a.remove());
        this.anchors = this.anchors.filter(a => !a.isRemoved());
    }

    public clearAnchors() {
        for (let anchor of this.anchors) {
            anchor.remove();
        }
        this.anchors = new Array<AnchorTile>();
    }

    public clearTiles() {
        for (let history of this.histories) {
            history.path.forEach(path => path.remove());
            history.unvisited.forEach(detail => detail.remove());
        }
    }
}

class ForegroundLayer extends Layer {
    private readonly assetIds: ReadonlyArray<string>;

    public obstacle: number;
    public isPathfindingOnly: boolean;
    public objectPracingPredicate: (i: number, j: number, obstacle: number) => boolean;
    public pathPlacingCallback: (i: number, j: number) => boolean;

    constructor(sourceLayer: Layer, element: SVGGElement, assetIds: ReadonlyArray<string>) {
        super(element, sourceLayer.tileWidth, sourceLayer.tileHeight, sourceLayer.mapWidth, sourceLayer.mapHeight);

        this.element.parentElement.addEventListener("mouseup", e => this.onSourceLayerMouseUp(e));
        this.element.parentElement.addEventListener("contextmenu", e => e.preventDefault());
        this.assetIds = assetIds;
        this.obstacle = 1;
        this.isPathfindingOnly = false;

        for (let obj of this.element.parentElement.querySelectorAll("#obstacle-list > svg")) {
            obj.addEventListener("click", e => this.onChangeObstacle(e));
        }
    }

    private onSourceLayerMouseUp(event: MouseEvent) {
        var rect = this.element.parentElement.getBoundingClientRect();
        var i = Math.floor((event.clientX - rect.left) / this.tileWidth);
        var j = Math.floor((event.clientY - rect.top) / this.tileHeight);

        if (this.isPathfindingOnly) { 
            if (this.pathPlacingCallback != null) {
                this.pathPlacingCallback(i, j);
            }
            return;
        }
        switch (event.button) {
            case 0:
                if (this.objectPracingPredicate != null && this.objectPracingPredicate(i, j, this.obstacle)) {
                    this.placeObject(i, j);
                }
                else {
                    this.removeObject(i, j);
                }
                break;
            case 2:
                if (this.pathPlacingCallback != null) {
                    this.pathPlacingCallback(i, j);
                }
                break;
        }
    }

    private onChangeObstacle(event: Event) {
        this.obstacle = parseInt(event.srcElement.getAttribute("data-obstacle-value"));
    }

    public placePath(path: ReadonlyArray<Step>, assetIdSelector: (step: Step) => string) {
        for (let step of path) {
            var id = "step-x-" + step.x.toString() + "-y-" + step.y.toString();
            var existing = this.element.querySelector("#" + id);
            var assetId = assetIdSelector(step);

            if (existing != null) {
                existing.remove();
            }
            if (assetId != null && assetId.length > 0) {
                this.placeImage(step.x, step.y, "path-" + assetId).id = id;
            }
        }
    }

    public removePath(path: ReadonlyArray<Step>, assetIdSelector: (step: Step) => string) {
        for (let step of path) {
            var id = this.removeStep(step.x, step.y);
            var assetId = assetIdSelector(step);

            if (assetId != null && assetId.length > 0) {
                this.placeImage(step.x, step.y, "path-" + assetId).id = id;
            }
        }
    }

    public removeStep(x: number, y: number): string {
        var id = "step-x-" + x.toString() + "-y-" + y.toString();

        if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) {
            return id;
        }
        var existing = this.element.querySelector("#" + id);

        if (existing != null) {
            existing.remove();
        }
        return id;
    }

    public placeStep(x: number, y: number, assertId: string) {
        if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) {
            return;
        }
        this.placeImage(x, y, assertId);
    }

    private placeImage(x: number, y: number, assertId: string): SVGUseElement {
        var img = document.createElementNS("http://www.w3.org/2000/svg", "use");

        img.x.baseVal.value = x * this.tileWidth;
        img.y.baseVal.value = y * this.tileHeight;
        img.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#" + assertId);
        img.classList.add("image-x-" + x.toString() + "-y-" + y.toString());

        this.element.appendChild(img);
        return img;
    }

    public placeObject(x: number, y: number) {
        if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) {
            return;
        }
        var id = "object-x-" + x.toString() + "-y-" + y.toString();
        var existing = this.element.querySelector("#" + id);

        if (existing != null) {
            existing.remove();
        } 
        // Replace the path with obstacle.
        this.removeStep(x, y);
        // because the property is not an index so we need to substract the value by one.
        this.placeImage(x, y, this.assetIds[this.obstacle - 1]).id = id;
    }

    public removeObject(x: number, y: number) {
        if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) {
            return;
        }
        var id = "object-x-" + x.toString() + "-y-" + y.toString();
        var existing = this.element.querySelector("#" + id);

        if (existing != null) {
            existing.remove();
        }
    }

    public clearMap() {
        for (let img of this.element.querySelectorAll("use")) {
            img.remove();
        }
    }
}