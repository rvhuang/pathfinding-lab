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

    public createPathfindingRequestBody(body: PathfindingRequestBody, x: number, y: number): boolean {
        if (isNaN(this.fromX) && isNaN(this.fromY)) {
            this.fromX = x;
            this.fromY = y;

            return false;
        }
        if (this.fromX == x && this.fromY == y) {
            return false;
        }

        body.fromX = this.fromX;
        body.fromY = this.fromY;
        body.goalX = x;
        body.goalY = y;
        body.map = this.map;

        this.fromX = NaN;
        this.fromY = NaN;

        return true; // Ready for sending request.
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
            name += "D";
        if ((this.direction & Direction.Left) == Direction.Left)
            name += "L";
        if ((this.direction & Direction.Right) == Direction.Right)
            name += "R";
        if ((this.direction & Direction.Up) == Direction.Up)
            name += "U";

        switch (name) {
            case "U":
            case "D":
                name = "DU";
                break;
            case "L":
            case "R":
                name = "LR";
                break;
        }
        return name;
    }
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
        linq.push("               " + PathfindingRequestBody.getOrderByThenByStatement(this.heuristics));
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
        linq.push("               " + PathfindingRequestBody.getOrderByThenByStatement(this.heuristics));
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
        linq.push("               " + PathfindingRequestBody.getOrderByThenByStatement(this.heuristics));
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

class PathfindingHistory implements Pathfinding {
    public readonly path: ReadonlyArray<Step>;
    public readonly heuristics: string[];
    public readonly algorithm: string;
    public readonly algorithmShortName: string;
    public readonly pathColor: string;

    public isVisible: boolean;

    constructor(path: Array<Step>, heuristics: Array<string>, algorithm: string) {
        this.path = path;
        this.heuristics = heuristics;
        this.algorithm = algorithm;
        this.algorithmShortName = PathfindingHistory.getAlgorithmShortName(algorithm);
        this.pathColor = PathfindingHistory.getAlgorithmPathColor(algorithm);
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
    public readonly canvas: HTMLCanvasElement;
    public readonly tileWidth: number; // unit: px
    public readonly tileHeight: number; // unit: px
    public readonly mapWidth: number; // unit: tile
    public readonly mapHeight: number; //  unit: tile

    constructor(canvas: HTMLCanvasElement, tileWidth: number, tileHeight: number, mapWidth: number, mapHeight: number) {
        this.canvas = canvas;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
    }

    public static mergeIntoDataURL(layers: Layer[]): string {
        var result = document.createElement('canvas');

        result.width = layers[0].canvas.width; // based on bottom layer.
        result.height = layers[0].canvas.height;

        var ctx = result.getContext("2d");

        for (var layer of layers) {
            ctx.drawImage(layer.canvas, 0, 0);
        }
        return result.toDataURL();
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
    private readonly cursorAsset: HTMLImageElement;
    private readonly tiles: Array<CursorTile>;

    private _i: number;
    private _j: number;

    public readonly paths: Array<PathfindingHistory>;

    constructor(canvas: HTMLCanvasElement, assetUrl: string, tileWidth: number, tileHeight: number, mapWidth: number, mapHeight: number) {
        super(canvas, tileWidth, tileHeight, mapWidth, mapHeight);

        this.cursorAsset = new Image();
        this.cursorAsset.addEventListener("load", e => this.onCursorAssetLoaded(e));
        this.cursorAsset.src = assetUrl;
        this.tiles = new Array<CursorTile>();
        this.paths = new Array<PathfindingHistory>();

        this._i = 0;
        this._j = 0;
    }

    public togglePath(index: number): boolean {
        var path = this.paths[index];
        if (path == null) return;

        var ctx = this.canvas.getContext("2d");

        path.isVisible = !path.isVisible;
        for (let step of path.path) {
            this.restoreTile(ctx, step.x, step.y);
        }
        return path.isVisible;
    }

    public placeTile(i: number, j: number, color: string): boolean {
        var found = false;

        for (var index = 0; index < this.tiles.length; index++) {
            var tile = this.tiles[index];

            if (tile.x == i && tile.y == j) {
                if (tile.color == color) {
                    return false; // Already exists. Do nothing here.
                }
                else {
                    this.tiles[index] = { x: i, y: j, color: color }; // Update color.
                }
                found = true;
                break;
            }
        }
        if (!found) {
            this.tiles.push({ x: i, y: j, color: color }); // Does not exist. Add new one.
        }
        this.restoreTile(this.canvas.getContext("2d"), i, j);
        return true;
    }

    public clearTiles() {
        var ctx = this.canvas.getContext("2d");

        for (let tile of this.tiles.splice(0, this.tiles.length)) {
            this.restoreTile(ctx, tile.x, tile.y);
        }
    }

    private restoreTile(ctx: CanvasRenderingContext2D, i: number, j: number) {
        var globalAlpha = ctx.globalAlpha;
        var fillStyle = ctx.fillStyle;

        ctx.clearRect(i * this.tileWidth, j * this.tileWidth, this.tileHeight, this.tileHeight);
        ctx.globalAlpha = 0.6;

        for (let path of this.paths) {
            if (path.isVisible && path.path.some(t => t.x == i && t.y == j)) {
                ctx.fillStyle = path.pathColor;
                ctx.fillRect(i * this.tileWidth, j * this.tileWidth, this.tileHeight, this.tileHeight);
            }
        }
        for (let tile of this.tiles) {
            if (tile.x == i && tile.y == j) {
                ctx.fillStyle = tile.color;
                ctx.fillRect(i * this.tileWidth, j * this.tileWidth, this.tileHeight, this.tileHeight);
            }
        }
        ctx.fillStyle = fillStyle;
        ctx.globalAlpha = globalAlpha;
    }

    private onCursorAssetLoaded(event: Event) {
        this.canvas.addEventListener("mousemove", e => this.onCursorLayerMouseMove(e)); // #007bff
        this.canvas.addEventListener("mouseleave", e => this.onCursorLayerMouseLeave(e)); // #007bff
    }

    private onCursorLayerMouseMove(event: MouseEvent) {
        var rect = this.canvas.getBoundingClientRect();
        var i = Math.floor((event.clientX - rect.left) / this.tileWidth);
        var j = Math.floor((event.clientY - rect.top) / this.tileHeight);

        if (i !== this._i || j !== this._j) {
            var ctx = this.canvas.getContext("2d");

            ctx.drawImage(this.cursorAsset, i * this.tileWidth, j * this.tileHeight);

            this.restoreTile(ctx, this._i, this._j);
            this._i = i;
            this._j = j;
        }
    }

    private onCursorLayerMouseLeave(event: MouseEvent) {
        this.restoreTile(this.canvas.getContext("2d"), this._i, this._j);
    }
}

class ForegroundLayer extends Layer {
    private readonly sourceLayer: Layer;
    private readonly foregroundAssets: ReadonlyArray<HTMLImageElement>;

    public objectPracingPredicate: (i: number, j: number) => boolean;
    public pathPlacingCallback: (i: number, j: number) => boolean;

    constructor(sourceLayer: Layer, canvas: HTMLCanvasElement, assetUrls: ReadonlyArray<string>) {
        super(canvas, sourceLayer.tileWidth, sourceLayer.tileHeight, sourceLayer.mapWidth, sourceLayer.mapHeight);

        this.sourceLayer = sourceLayer;
        this.sourceLayer.canvas.addEventListener("mouseup", e => this.onSourceLayerMouseUp(e));
        this.foregroundAssets = assetUrls.map(function (url) {
            var img = new Image();
            img.src = url;
            return img;
        });
    }

    private onSourceLayerMouseUp(event: MouseEvent) {
        var rect = this.canvas.getBoundingClientRect();
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

    public placePath(path: ReadonlyArray<Step>, assetUrlSelector: (step: Step) => string) {
        var ctx = this.canvas.getContext("2d");
        var tileWidth = this.tileWidth;
        var tileHeight = this.tileHeight;

        for (let step of path) {
            var img = new Image();

            img.addEventListener('load', function () {
                ctx.drawImage(this, step.x * tileWidth, step.y * tileHeight, tileWidth, tileHeight);
            }, false);
            img.src = assetUrlSelector(step);
        };
    }

    public placeStep (step: Step, assetUrl: string) {
        var ctx = this.canvas.getContext("2d");
        var img = new Image();
        var tileWidth = this.tileWidth;
        var tileHeight = this.tileHeight;

        img.addEventListener('load', function () {
            ctx.drawImage(this, step.x * tileWidth, step.y * tileHeight, tileWidth, tileHeight);
        }, false);
        img.src = assetUrl;
    }

    public placeObject(i: number, j: number) {
        var ctx = this.canvas.getContext("2d");
        var asset = this.foregroundAssets[(i + j) % this.foregroundAssets.length];

        ctx.drawImage(asset, i * this.tileWidth, j * this.tileHeight, Math.min(asset.width, this.tileWidth), Math.min(asset.height, this.tileHeight));
    }

    public removeObject(i: number, j: number) {
        var ctx = this.canvas.getContext("2d");

        ctx.clearRect(i * this.tileWidth, j * this.tileHeight, this.tileWidth, this.tileHeight);
    }

    public clearMap() {
        var ctx = this.canvas.getContext("2d");

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

class BackgroundLayer extends Layer {
    private readonly backgroundAssets: ReadonlyArray<HTMLImageElement>;

    constructor(sourceLayer: Layer, canvas: HTMLCanvasElement, assetUrls: ReadonlyArray<string>) {
        super(canvas, sourceLayer.tileWidth, sourceLayer.tileHeight, sourceLayer.mapWidth, sourceLayer.mapHeight);

        this.backgroundAssets = assetUrls.map(url => new Image());
        for (var i = 0; i < this.backgroundAssets.length; i++) {
            var img = this.backgroundAssets[i];

            img.addEventListener("load", e => this.onAssetLoaded(e));
            img.tabIndex = i;
            img.src = assetUrls[i];
        }
    }

    private onAssetLoaded(event: Event) {
        var ctx = this.canvas.getContext("2d");
        var asset = event.srcElement as HTMLImageElement;

        for (var i = 0; i < this.mapWidth; i++) {
            for (var j = 0; j < this.mapHeight; j++) {
                if ((i + j) % this.backgroundAssets.length === asset.tabIndex) {
                    ctx.drawImage(asset, i * this.tileWidth, j * this.tileWidth, this.tileWidth, this.tileHeight);
                }
            }
        }
    }
}