
abstract class Layer {
    public readonly element: SVGGElement;
    public readonly tileWidth: number; // unit: px
    public readonly tileHeight: number; // unit: px
    public readonly mapWidth: number; // unit: tile
    public readonly mapHeight: number; //  unit: tile

    constructor(canvas: SVGGElement, tileWidth: number, tileHeight: number, mapWidth: number, mapHeight: number) {
        this.element = canvas;
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
                
            for (let step of history.path) {
                step.visualize(this.tileWidth, this.tileHeight);
                this.element.appendChild(step.updateAnimation(begin));
                begin += 0.1;
            }
            for (let detail of history.details) {
                var filtered = history.path.filter(p => p.x === detail.x && p.y === detail.y);
                if (filtered.length > 0) {
                    detail.levels.forEach(level => filtered[0].updateLevels(level));
                }
                else {
                    this.element.appendChild(detail.visualize(this.tileWidth, this.tileHeight));
                }
            }
        }
        else {
            history.path.forEach(p => p.remove());
            history.details.forEach(d => d.remove());
        }
        return history.isVisible;
    }

    public placeTile(x: number, y: number, color: string) {
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
        this.anchors.filter(a => a.x === x && a.y === y).forEach(a => a.remove());
        this.anchors = this.anchors.filter(a => !a.isRemoved());
    }

    public clearTiles() {
        for (let history of this.histories) {
            history.path.forEach(path => path.remove());
            history.details.forEach(detail => detail.remove());
        }
        for (let anchor of this.anchors) {
            anchor.remove();
        }
    }
}

class ForegroundLayer extends Layer {
    private readonly assetIds: ReadonlyArray<string>;

    public objectPracingPredicate: (i: number, j: number) => boolean;
    public pathPlacingCallback: (i: number, j: number) => boolean;

    constructor(sourceLayer: Layer, element: SVGGElement, assetIds: ReadonlyArray<string>) {
        super(element, sourceLayer.tileWidth, sourceLayer.tileHeight, sourceLayer.mapWidth, sourceLayer.mapHeight);
        
        this.element.parentElement.addEventListener("mouseup", e => this.onSourceLayerMouseUp(e));
        this.assetIds = assetIds;
    }

    private onSourceLayerMouseUp(event: MouseEvent) {
        var rect = this.element.parentElement.getBoundingClientRect();
        var i = Math.floor((event.clientX - rect.left) / this.tileWidth);
        var j = Math.floor((event.clientY - rect.top) / this.tileHeight);

        switch (event.button) {
            case 0:
                if (this.objectPracingPredicate != null && this.objectPracingPredicate(i, j)) {
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

    public placePath(path: ReadonlyArray<Step>, assetIdSelector: (step: Step) => string) {
        for (let step of path) {
            this.placeImage(step.x, step.y, assetIdSelector(step));    
        };
    }

    public placeStep (step: Step, assertId: string) {
        this.placeImage(step.x, step.y, assertId);
    }

    private placeImage(x: number, y: number, assertId: string): SVGUseElement {
        var img = document.createElementNS("http://www.w3.org/2000/svg", "use");
    
        img.x.baseVal.value = x * this.tileWidth;
        img.y.baseVal.value = y * this.tileHeight;
        img.setAttribute("href", "#" + assertId);
        img.classList.add("image-x-" + x.toString() + "-y-" + y.toString());

        this.element.appendChild(img);
        return img;
    }

    public placeObject(x: number, y: number) { 
        this.placeImage(x, y, this.assetIds[(x + y) % this.assetIds.length]);
    }

    public removeObject(x: number, y: number) {
        for (let img of [].slice.call(this.element.getElementsByClassName("image-x-" + x.toString() + "-y-" + y.toString()))) {
            img.remove();
        }
    }

    public clearMap() {
        while (this.element.lastChild != null) {
            this.element.removeChild(this.element.lastChild);
        } 
    }
}