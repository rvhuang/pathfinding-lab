class Core {
    private readonly map: Direction[][];

    private fromX: number;
    private fromY: number;

    public constructor(mapWidth: number, mapHeight: number) {
        this.map = new Array<Direction[]>(mapHeight);

        for (var y = 0; y < mapHeight; y++) {
            this.map[y] = new Array<Direction>(mapWidth);
            for (var x = 0; x < mapWidth; x++) {
                this.map[y][x] = Direction.None;
            }
        }
        this.fromX = NaN;
        this.fromY = NaN;
    }

    public placeObstacle(x: number, y: number): boolean {
        if (isNaN(this.map[y][x])) {
            this.map[y][x] = Direction.None;
            return false;
        } else {
            this.map[y][x] = NaN; // NaN -> Obstacle
            return true;
        }
    }

    public isObstacle(x: number, y: number): boolean {
        return isNaN(this.map[y][x]);
    }

    public clearObstacles() {
        for (var y = 0; y < this.map.length; y++) {
            for (var x = 0; x < this.map[y].length; x++) {
                this.map[y][x] = Direction.None;
            }
        }
    }

    public saveMap() {
        localStorage.setItem("map", JSON.stringify(this.map));
    }

    public loadMap(placeObstacleCallback: (x: number, y: number) => any, placeStepCallback: (step: Step) => any) {
        var old = JSON.parse(localStorage.getItem("map")) as Array<Array<Direction>>;
        
        try {
            for (var y = 0; y < this.map.length; y++) {
                for (var x = 0; x < this.map[y].length; x++) {
                    var dir = old[y][x];

                    this.map[y][x] = dir;
                    if (isNaN(dir) || dir === null) {
                        placeObstacleCallback(x, y);
                    }
                    else if (dir != Direction.None) {
                        placeStepCallback(new Step(x, y, dir));
                    }
                }
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    public createPathfindingRequestBody(body: PathfindingRequestBody, x: number, y: number): PathfindingRequestStatus {
        if (isNaN(this.fromX) && isNaN(this.fromY)) {
            this.fromX = x;
            this.fromY = y;

            return PathfindingRequestStatus.Initiated;
        }
        if (this.fromX == x && this.fromY == y) {
            this.fromX = NaN;
            this.fromY = NaN;

            return PathfindingRequestStatus.None;
        }

        body.fromX = this.fromX;
        body.fromY = this.fromY;
        body.goalX = x;
        body.goalY = y;
        body.map = this.map;

        this.fromX = NaN;
        this.fromY = NaN;

        return PathfindingRequestStatus.Ready; // Ready for sending request.
    }

    public assignDirection(step: Step) {
        var existing = this.map[step.y][step.x];
        var dir = step.direction;

        if (!isNaN(existing)) { // NaN -> Obstacle
            dir = existing | step.direction;
        }
        this.map[step.y][step.x] = dir;
        step.direction = dir;
    }

    public assignDirections(solution: Array<Step>): ReadonlyArray<Step> {
        for (var i = 0; i < solution.length - 1; i++) {
            var x1 = solution[i].x;
            var y1 = solution[i].y;
            var x2 = solution[i + 1].x;
            var y2 = solution[i + 1].y;

            if (isNaN(solution[i].direction)) {
                solution[i].direction = Direction.None;
            }
            if (x1 > x2) {
                solution[i].direction = solution[i].direction | Direction.Left;
                solution[i + 1].direction = solution[i + 1].direction | Direction.Right;
            }
            else if (x1 < x2) {
                solution[i].direction = solution[i].direction | Direction.Right;
                solution[i + 1].direction = solution[i + 1].direction | Direction.Left;
            }
            if (y1 > y2) {
                solution[i].direction = solution[i].direction | Direction.Up;
                solution[i + 1].direction = solution[i + 1].direction | Direction.Down;
            }
            else if (y1 < y2) {
                solution[i].direction = solution[i].direction | Direction.Down;
                solution[i + 1].direction = solution[i + 1].direction | Direction.Up;
            }
            this.assignDirection(solution[i]);
        }
        return solution.map(s => new Step(s.x, s.y, s.direction));
    }
}

class Step {
    public x: number; // unit: tile
    public y: number; // unit: tile
    public direction: Direction;

    constructor(x: number, y: number, dir: Direction) {
        this.x = x;
        this.y = y;
        this.direction = dir;
    }

    public getDirectionShortName(): string {
        var name = "";

        if ((this.direction & Direction.Down) == Direction.Down)
            name += "d";
        if ((this.direction & Direction.Left) == Direction.Left)
            name += "l";
        if ((this.direction & Direction.Right) == Direction.Right)
            name += "r";
        if ((this.direction & Direction.Up) == Direction.Up)
            name += "u";

        switch (name) {
            case "u":
            case "d":
                name = "du";
                break;
            case "l":
            case "r":
                name = "lr";
                break;
        }
        return name;
    }
}

enum PathfindingRequestStatus {
    None = 0,
    Initiated = 1, 
    Ready = 2,
}

enum Direction {
    None = 0,
    Up = 1,
    Down = 2,
    Left = 4,
    Right = 8
}

interface Pathfinding {
    heuristics: string[];
    algorithm: string;

    toSelectManyExpression(mapWidth: number, mapHeight: number): string[];
    toExceptExpression(mapWidth: number, mapHeight: number): string[];
    toWhereOnlyExpression(mapWidth: number, mapHeight: number): string[];
}

class PathfindingRequestBody implements Pathfinding {
    public fromX: number;
    public fromY: number;
    public goalX: number;
    public goalY: number;
    public map: number[][];
    public heuristics: string[];
    public algorithm: string;

    public constructor() {
        this.fromX = 0;
        this.fromY = 0;
        this.goalX = 0;
        this.goalY = 0;
        this.algorithm = "AStar";
        this.heuristics = new Array<string>();
        this.heuristics.push("GetManhattanDistance");
    }

    public toSelectManyExpression(mapWidth: number, mapHeight: number): string[] {
        var linq = [
            PathfindingRequestBody.getStartStatement(this.fromX, this.fromY),
            PathfindingRequestBody.getGoalStatement(this.goalX, this.goalY),
            PathfindingRequestBody.getBoundaryStatement(mapWidth, mapHeight),
            PathfindingRequestBody.getInitializationStatement(this.algorithm)
        ];

        linq.push("var solution = from p in queryable");
        linq.push("               from obstacle in GetMapObstacles()");
        linq.push("               where boundary.Contains(p) && p != obstacle");
        if (this.heuristics.length > 0) {
            linq.push("               " + PathfindingRequestBody.getOrderByThenByStatement(this.heuristics));
        }
        linq.push("               select p;");

        return linq;
    }

    public toExceptExpression(mapWidth: number, mapHeight: number): string[] {
        var linq = [
            PathfindingRequestBody.getStartStatement(this.fromX, this.fromY),
            PathfindingRequestBody.getGoalStatement(this.goalX, this.goalY),
            PathfindingRequestBody.getBoundaryStatement(mapWidth, mapHeight),
            PathfindingRequestBody.getInitializationStatement(this.algorithm)
        ];

        linq.push("var solution = from p in queryable.Except(GetMapObstacles())");
        linq.push("               where boundary.Contains(p)");
        if (this.heuristics.length > 0) {
            linq.push("               " + PathfindingRequestBody.getOrderByThenByStatement(this.heuristics));
        }
        linq.push("               select p;");

        return linq;
    }

    public toWhereOnlyExpression(mapWidth: number, mapHeight: number): string[] {
        var linq = [
            PathfindingRequestBody.getStartStatement(this.fromX, this.fromY),
            PathfindingRequestBody.getGoalStatement(this.goalX, this.goalY),
            PathfindingRequestBody.getBoundaryStatement(mapWidth, mapHeight),
            PathfindingRequestBody.getInitializationStatement(this.algorithm)
        ];

        linq.push("var obstacles = GetMapObstacles();");
        linq.push("var solution = from p in queryable");
        linq.push("               where boundary.Contains(p) && !obstacles.Contains(p)");
        if (this.heuristics.length > 0) {
            linq.push("               " + PathfindingRequestBody.getOrderByThenByStatement(this.heuristics));
        }
        linq.push("               select p;");

        return linq;
    }

    public static getStartStatement(fromX: number, fromY: number): string {
        return "var start = new Point(" + fromX + ", " + fromY + ");"
    }

    public static getGoalStatement(goalX: number, goalY: number): string {
        return "var goal = new Point(" + goalX + ", " + goalY + ");"
    }

    public static getBoundaryStatement(mapWidth: number, mapHeight: number): string {
        return "var boundary = new Rectangle(0, 0, " + mapWidth + ", " + mapHeight + ");"
    }

    public static getInitializationStatement(algorithm: string): string {
        switch (algorithm) {
            case "AStar":
                return "var queryable = HeuristicSearch.AStar(start, goal, (s, i) => s.GetFourDirections(unit));";
            case "BestFirstSearch":
                return "var queryable = HeuristicSearch.BestFirstSearch(start, goal, (s, i) => s.GetFourDirections(unit));";
            case "IterativeDeepeningAStar":
                return "var queryable = HeuristicSearch.IterativeDeepeningAStar(start, goal, (s, i) => s.GetFourDirections(unit));";
            case "RecursiveBestFirstSearch":
                return "var queryable = HeuristicSearch.RecursiveBestFirstSearch(start, goal, (s, i) => s.GetFourDirections(unit));";
        }
        return "var queryable = HeuristicSearch.AStar(start, goal, (s, i) => s.GetFourDirections(unit));";
    }

    public static getOrderByThenByStatement(heuristics: ReadonlyArray<string>): string {
        var statement = "orderby ";
        var statements = new Array<string>();

        for (var i = 0; i < heuristics.length; i++) {
            switch (heuristics[i]) {
                case "GetChebyshevDistance":
                    statements.push("p.GetChebyshevDistance(goal)");
                    break;
                case "GetEuclideanDistance":
                    statements.push("p.GetEuclideanDistance(goal)");
                    break;
                case "GetManhattanDistance":
                    statements.push("p.GetManhattanDistance(goal)");
                    break;
                default:
                    statements.push("p.GetManhattanDistance(goal)");
                    break;
            }
        }
        return statement + statements.join(", ");
    }
}

class Detail {
    public level: number;
    public step: Step;
}

class PathfindingHistory implements Pathfinding {
    public readonly path: ReadonlyArray<Step>;
    public readonly details: ReadonlyArray<Detail>;
    public readonly heuristics: string[];
    public readonly algorithm: string;
    public readonly algorithmShortName: string;
    public readonly color: string;

    public isVisible: boolean;

    constructor(path: Array<Step>, heuristics: Array<string>, algorithm: string, details: ReadonlyArray<Detail>) {
        this.path = path;
        this.details = details;
        this.heuristics = heuristics;
        this.algorithm = algorithm;
        this.algorithmShortName = PathfindingHistory.getAlgorithmShortName(algorithm);
        this.color = PathfindingHistory.getAlgorithmPathColor(algorithm);
        this.isVisible = false;
    }

    public toSelectManyExpression(mapWidth: number, mapHeight: number): string[] {
        var linq = [
            PathfindingRequestBody.getStartStatement(this.path[0].x, this.path[0].y),
            PathfindingRequestBody.getGoalStatement(this.path[this.path.length - 1].x, this.path[this.path.length - 1].y),
            PathfindingRequestBody.getBoundaryStatement(mapWidth, mapHeight),
            PathfindingRequestBody.getInitializationStatement(this.algorithm)
        ];

        linq.push("var solution = from p in queryable");
        linq.push("               from obstacle in GetMapObstacles()");
        linq.push("               where boundary.Contains(p) && p != obstacle");
        linq.push("               " + PathfindingRequestBody.getOrderByThenByStatement(this.heuristics));
        linq.push("               select p;");

        return linq;
    }

    public toExceptExpression(mapWidth: number, mapHeight: number): string[] {
        var linq = [
            PathfindingRequestBody.getStartStatement(this.path[0].x, this.path[0].y),
            PathfindingRequestBody.getGoalStatement(this.path[this.path.length - 1].x, this.path[this.path.length - 1].y),
            PathfindingRequestBody.getBoundaryStatement(mapWidth, mapHeight),
            PathfindingRequestBody.getInitializationStatement(this.algorithm)
        ];

        linq.push("var solution = from p in queryable.Except(GetMapObstacles())");
        linq.push("               where boundary.Contains(p)");
        linq.push("               " + PathfindingRequestBody.getOrderByThenByStatement(this.heuristics));
        linq.push("               select p;");
        linq.push("               // --"); // Keeps same number of lines.

        return linq;
    }

    public toWhereOnlyExpression(mapWidth: number, mapHeight: number): string[] {
        var linq = [
            PathfindingRequestBody.getStartStatement(this.path[0].x, this.path[0].y),
            PathfindingRequestBody.getGoalStatement(this.path[this.path.length - 1].x, this.path[this.path.length - 1].y),
            PathfindingRequestBody.getBoundaryStatement(mapWidth, mapHeight),
            PathfindingRequestBody.getInitializationStatement(this.algorithm)
        ];

        linq.push("var obstacles = GetMapObstacles();");
        linq.push("var solution = from p in queryable");
        linq.push("               where boundary.Contains(p) && !obstacles.Contains(p)");
        linq.push("               " + PathfindingRequestBody.getOrderByThenByStatement(this.heuristics));
        linq.push("               select p;");

        return linq;
    }

    public static getAlgorithmShortName(algorithm: string): string {
        switch (algorithm) {
            case "AStar":
                return "A*";
            case "BestFirstSearch":
                return "BFS";
            case "IterativeDeepeningAStar":
                return "IDA*";
            case "RecursiveBestFirstSearch":
                return "RBFS";
            default:
                return "A*";
        }
    }

    public static getAlgorithmPathColor(algorithm: string): string {
        switch (algorithm) {
            case "AStar":
                return "#17a2b8";
            case "BestFirstSearch":
                return "#dc3545";
            case "IterativeDeepeningAStar":
                return "#343a40";
            case "RecursiveBestFirstSearch":
                return "#ffc107";
            default:
                return "#17a2b8";
        }
    }
}

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

class CursorTile {
    public readonly x: number; // unit: tile
    public readonly y: number; // unit: tile
    public readonly color: string; // #007bff

    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.color = color;
    }
}

class CursorLayer extends Layer { 
    private readonly cursor: SVGRectElement;

    private cursorX: number = 0;
    private cursorY: number = 0;

    public readonly histories: Array<PathfindingHistory>;

    constructor(element: SVGGElement, cursor: SVGRectElement, tileWidth: number, tileHeight: number, mapWidth: number, mapHeight: number) {
        super(element, tileWidth, tileHeight, mapWidth, mapHeight);

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
            
            for (let detail of history.details.filter(d => d.level >= 0 && d.step.x >= 0 && d.step.y >= 0)) {
                let rect = document.getElementById("detail-tile").cloneNode(true) as SVGElement;
                let label = rect.querySelector("text") as SVGTextElement;

                rect.setAttribute("x", (detail.step.x * this.tileWidth).toString());
                rect.setAttribute("y", (detail.step.y * this.tileHeight).toString());
                rect.querySelector("rect").setAttribute("stroke", history.color);

                label.textContent = detail.level.toString();

                if (history.path.some(s => s.x === detail.step.x && s.y === detail.step.y)) {
                    // The step appears in the solution.
                    rect.classList.add("path-index");
                    rect.classList.add("path-index-" + index.toString());
                    rect.querySelector("rect").setAttribute("fill", history.color);
                    rect.querySelector("rect").querySelector("animate").setAttribute("begin", "DOMNodeInsertedIntoDocument+" + begin.toString() + "s");

                    begin += 0.1;
                }
                else {
                    rect.classList.add("unvisited-index");
                    rect.classList.add("unvisited-index-" + index.toString());
                    rect.querySelector("rect").querySelector("animate").remove();
                }
                this.element.appendChild(rect);
            }
        }
        else { 
            for (let rect of [].slice.call(this.element.getElementsByClassName("path-index-" + index.toString()))) {
                rect.remove();
            }
            for (let rect of [].slice.call(this.element.getElementsByClassName("unvisited-index-" + index.toString()))) {
                rect.remove();
            }
        }
        return history.isVisible;
    }

    public placeTile(x: number, y: number, color: string) {
        var elementId = "tile-index-" + x.toString() + "-" + y.toString();
        var rect = this.element.querySelector("#" + elementId);

        if (rect != null) {
            rect.setAttribute("fill", color);
        }
        else {
            let tile = document.createElementNS("http://www.w3.org/2000/svg", "use");

            tile.id = elementId;
            tile.x.baseVal.value = x * this.tileWidth;
            tile.y.baseVal.value = y * this.tileHeight;
            tile.width.baseVal.value = this.tileWidth;
            tile.height.baseVal.value = this.tileHeight;
            tile.classList.add("tile-index");
            tile.setAttribute("fill", color);
            tile.setAttribute("href", "#cursor-tile");

            this.element.appendChild(tile);
        }
    }

    public removeTile(x: number, y: number) {
        var elementId = "tile-index-" + x.toString() + "-" + y.toString();
        var rect = this.element.querySelector("#" + elementId);

        if (rect != null) {
            rect.remove();
        }
    }

    public clearTiles() {
        for (let rect of [].slice.call(this.element.getElementsByClassName("path-index"))) {
            rect.remove();
        }
        for (let rect of [].slice.call(this.element.getElementsByClassName("tile-index"))) {
            rect.remove();
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