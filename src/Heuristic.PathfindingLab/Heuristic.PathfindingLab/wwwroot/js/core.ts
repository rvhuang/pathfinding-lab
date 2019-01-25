class Core {
    public readonly mapWidth: number;
    public readonly mapHeight: number;


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
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.fromX = NaN;
        this.fromY = NaN;
    }

    public placeObstacle(x: number, y: number, obstacle: number): boolean {
        if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) {
            return false;
        }
        if (this.map[y][x] < 0) {
            this.map[y][x] = Direction.None; // clear obstacle
            return false;
        } else {
            // less than zero -> obstacle
            // 0 -> none 
            this.map[y][x] = 0 - Math.abs(obstacle);
            return true;
        }
    }

    public isObstacle(x: number, y: number): boolean {
        if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) {
            return true;
        }
        return this.map[y][x] < 0;
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

    public loadMap(placeObstacleCallback: (x: number, y: number, obstacle: number) => any, placeStepCallback: (step: Step) => any) {
        var old = JSON.parse(localStorage.getItem("map")) as number[][];
        
        try {
            for (var y = 0; y < this.map.length; y++) {
                for (var x = 0; x < this.map[y].length; x++) {
                    var value = old[y][x];

                    this.map[y][x] = value;
                    if (value < 0) { // less than zero -> Obstacle
                        placeObstacleCallback(x, y, value);
                    }
                    else if (value != Direction.None) {
                        placeStepCallback(new Step(x, y, value));
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

        if (existing >= 0) { // less than zero -> Obstacle
            dir = existing | step.direction;
        }
        this.map[step.y][step.x] = dir;
        step.direction = dir;
    }

    public assignDirections(solution: Array<Step>): ReadonlyArray<Step> {
        for (let i = 0; i < solution.length - 1; i++) {
            let x1 = solution[i].x;
            let y1 = solution[i].y;
            let x2 = solution[i + 1].x;
            let y2 = solution[i + 1].y;

            if (solution[i].direction < 0) { // less than zero -> Obstacle
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
        this.assignDirection(solution[solution.length - 1]);
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

class PathfindingSettings {

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
    public readonly path: ReadonlyArray<PathTile>;
    public readonly details: ReadonlyArray<UnvisitedTile>;
    public readonly heuristics: string[];
    public readonly algorithm: string;
    public readonly algorithmShortName: string;
    public readonly color: string;

    public isVisible: boolean;

    constructor(path: Array<Step>, heuristics: Array<string>, algorithm: string, details: ReadonlyArray<Detail>) {        
        this.color = PathfindingHistory.getAlgorithmPathColor(algorithm);
        this.path = path.map((p, i) => new PathTile(p.x, p.y, i, this.color));
        this.details = UnvisitedTile.merge(details.map(d => new UnvisitedTile(d.step.x, d.step.y, d.level, this.color)));
        this.heuristics = heuristics;
        this.algorithm = algorithm;
        this.algorithmShortName = PathfindingHistory.getAlgorithmShortName(algorithm);
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