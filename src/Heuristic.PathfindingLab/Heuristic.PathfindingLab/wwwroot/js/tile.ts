abstract class Tile<TElement extends SVGElement> {
    public readonly x: number; // unit: tile
    public readonly y: number; // unit: tile
    public readonly color: string; // #007bff

    protected get element(): TElement {
        return this._element;
    }

    private _element: TElement;
    
    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.color = color;
    }

    protected abstract initialize( tileWidth: number, tileHeight: number): TElement;

    public visualize( tileWidth: number, tileHeight: number) {
        this._element = this.initialize( tileWidth, tileHeight);
    }

    public remove() {
        if (this._element != null) {
            this._element.remove();
        }
    }

    public isRemoved(): boolean {
        return this._element != null && this._element.parentElement === null;
    }
}

class PathTile extends Tile<SVGElement> {
    public readonly levels: Array<number>;

    private readonly step: Step;

    constructor(detail: Detail, color: string) {
        super(detail.step.x, detail.step.y, color);

        this.levels = [detail.level];
        this.step = detail.step;
    }

    public updateLevels(level: number) {
        this.levels.push(level); 
        super.element.querySelector("text").textContent = this.levels.join(", ");
    }

    protected initialize( tileWidth: number, tileHeight: number): SVGElement {
        let rect = document.getElementById("detail-tile").cloneNode(true) as SVGElement;
        let label = rect.querySelector("text") as SVGTextElement;

        rect.setAttribute("x", (this.step.x * tileWidth).toString());
        rect.setAttribute("y", (this.step.y * tileHeight).toString());
        rect.querySelector("rect").setAttribute("stroke", this.color);
        rect.querySelector("rect").setAttribute("fill", this.color);

        label.textContent = this.levels.join(", ");

        return rect;
    }
}

class UnvisitedTile extends Tile<SVGElement> {
    public readonly levels: Array<number>;

    private readonly step: Step;

    constructor(detail: Detail, color: string) {
        super(detail.step.x, detail.step.y, color);

        this.levels = [];
        this.step = detail.step;
    }

    public updateLevels(level: number) {
        this.levels.push(level);
        super.element.querySelector("text").textContent = this.levels.join(", ");
    }

    protected initialize( tileWidth: number, tileHeight: number): SVGElement {
        let rect = document.getElementById("detail-tile").cloneNode(true) as SVGElement;
        let label = rect.querySelector("text") as SVGTextElement;

        rect.setAttribute("x", (this.step.x * tileWidth).toString());
        rect.setAttribute("y", (this.step.y * tileHeight).toString());
        rect.querySelector("rect").setAttribute("stroke", this.color);
        rect.querySelector("rect").querySelector("animate").remove();

        label.textContent = this.levels.join(", ");

        return rect;
    }
}

class CursorTile extends Tile<SVGRectElement> {
    constructor(x: number, y: number, color: string, layerElement: SVGGElement) {
        super(x, y, color);

    }

    protected initialize(tileWidth: number, tileHeight: number): SVGRectElement {

        return null;
    }
}

