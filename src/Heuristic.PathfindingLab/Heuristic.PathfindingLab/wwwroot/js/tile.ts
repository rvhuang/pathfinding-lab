abstract class Tile<TElement extends SVGElement> {
    public readonly x: number; // unit: tile
    public readonly y: number; // unit: tile
    
    private _color: string; // #007bff
    private _element: TElement;
 
    protected get color() : string {
        return this._color;
    }
    protected set color(value: string) {
        this._color = value;
    }
    protected get element(): TElement {
        return this._element;
    }
    
    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this._color = color;
    }

    protected abstract initialize(tileWidth: number, tileHeight: number): TElement;

    public visualize(tileWidth: number, tileHeight: number): TElement {
        return this._element = this.initialize(tileWidth, tileHeight);
    }

    public hide() {
        if (this._element != null) {
            this._element.style.visibility = "none";
        }
    }

    public show() {
        if (this._element != null) {
            this._element.style.visibility = "";
        }
    }
    
    public remove() {
        if (this._element != null) {
            this._element.remove();
            this._element = null;
        }
    }

    public isRemoved(): boolean {
        return this._element == null || this._element.parentElement === null;
    }
}

abstract class SolutionTile extends Tile<SVGElement> {
    public readonly levels: Array<number>;
 
    constructor(x: number, y: number, level: number, color: string) {
        super(x, y, color);
        this.levels = [level]; 
    }

    public updateLevels(level: number) {
        if (this.levels.indexOf(level) < 0) {
            this.levels.push(level);
        }
        if (this.element != null) {
            this.element.querySelector("text").textContent = this.levels.join(", ");
        }
    }

    public describes() : string {
        var description = "";

        if (this.levels.length > 1) {
            description += "The node {" + this.x + ", " + this.y + "} has been explored for " + this.levels.length + " times. ";
            description += "The depths (levels) of the node are " + this.levels.join(", ") + " respectively.";
        }
        else {
            description += "The node {" + this.x + ", " + this.y + "} has been explored for 1 time. ";
            description += "The depth (level) of the node is " + this.levels.join(", ") + ".";
        }
        return description;
    }
}

class PathTile extends SolutionTile {  
    constructor(x: number, y: number, level: number, color: string) {
        super(x, y, level, color); 
    }
 
    public updateAnimation(begin: number) : SVGElement {
        if (this.element != null) {
            this.element.querySelector("rect").querySelector("animate").setAttribute("begin", "DOMNodeInsertedIntoDocument+" + begin + "s");
        }
        return this.element;
    } 

    protected initialize(tileWidth: number, tileHeight: number): SVGElement {
        let rect = document.getElementById("detail-tile").cloneNode(true) as SVGElement;
        let label = rect.querySelector("text") as SVGTextElement;

        rect.setAttribute("x", (this.x * tileWidth).toString());
        rect.setAttribute("y", (this.y * tileHeight).toString());
        rect.querySelector("rect").setAttribute("stroke", this.color);
        rect.querySelector("rect").setAttribute("fill", this.color);

        label.textContent = this.levels.join(", ");
        return rect;
    }
}

class UnvisitedTile extends SolutionTile {
    public readonly levels: Array<number>;

    constructor(x: number, y: number, level: number, color: string) {
        super(x, y, level, color); 
    }
 
    protected initialize(tileWidth: number, tileHeight: number): SVGElement {
        let rect = document.getElementById("detail-tile").cloneNode(true) as SVGElement;
        let label = rect.querySelector("text") as SVGTextElement;

        rect.setAttribute("x", (this.x * tileWidth).toString());
        rect.setAttribute("y", (this.y * tileHeight).toString());
        rect.querySelector("rect").setAttribute("stroke", this.color);
        rect.querySelector("rect").querySelector("animate").remove();

        label.textContent = this.levels.join(", ");

        return rect;
    } 

    public static merge(tiles: ReadonlyArray<UnvisitedTile>): ReadonlyArray<UnvisitedTile> {
        var merged = [] as Array<UnvisitedTile>;

        for (let tile of tiles) {
            let filtered = merged.filter(t => t.x === tile.x && t.y === tile.y);
            
            if (filtered.length > 0) {
                tile.levels.forEach(level => filtered[0].updateLevels(level));
            }
            else {
                merged.push(tile);
            }
        }
        return merged;
    }
}

class AnchorTile extends Tile<SVGUseElement> {
    constructor(x: number, y: number, color: string) {
        super(x, y, color);
    }

    public updateColor(color: string) {
        this.color = color;
        this.element.setAttribute("fill", color);
    }

    protected initialize(tileWidth: number, tileHeight: number): SVGUseElement {
        let rect = document.createElementNS("http://www.w3.org/2000/svg", "use");

        rect.x.baseVal.value = this.x * tileWidth;
        rect.y.baseVal.value = this.y * tileHeight;
        rect.width.baseVal.value = tileWidth;
        rect.height.baseVal.value = tileHeight;
        rect.setAttribute("fill", this.color);
        rect.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#cursor-tile");

        return rect;
    }
}

