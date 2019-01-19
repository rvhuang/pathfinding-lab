# Pathfinding Lab

A playground where you can experiment, run and compare different algorithms and heuristic functions.

Visit [the instance](http://pathfinding-lab.codedwith.fun/) running on DigitalOcean and try it out.

Read the article at [CodeProject](https://www.codeproject.com/Articles/1250578/A-Simple-Pathfinding-Laboratory) for detailed information.

## Build the project

```bat
cd src/Heuristic.PathfindingLab/Heuristic.PathfindingLab/
tsc -p tsconfig.json --out "wwwroot/js/core.js"
dotnet build Heuristic.PathfindingLab.csproj
```

## Build Docker image

```bat
cd src/Heuristic.PathfindingLab/Heuristic.PathfindingLab/
docker build -t pathfinding-lab .
```

## Run Dockerized instance

```bat
docker pull rvhuang/pathfinding-lab:latest
docker run -d -p 8080:80 pathfinding-lab:latest --name p-lab
```

## License

Copyright © Robert Vandenberg Huang

The project is licensed under the MIT license. Feel free to copy, modify and use in your computer science homework (grades not guaranteed).
