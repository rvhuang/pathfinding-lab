# Pathfinding Laboratory

A playground where you can run, test and compare different algorithms and heuristic functions.

Visit [the website](https://pathfinding-lab.codedwith.fun/) running on DigitalOcean and try it out.

Read the article at [CodeProject](https://www.codeproject.com/Articles/1250578/A-Simple-Pathfinding-Laboratory) for detailed information.

## Build the project

```sh
cd src/Heuristic.PathfindingLab/Heuristic.PathfindingLab/
tsc -p tsconfig.json
dotnet build Heuristic.PathfindingLab.csproj
```

## Build Docker image

```sh
cd src/Heuristic.PathfindingLab/Heuristic.PathfindingLab/
docker build -t pathfinding-lab .
```

## Run Dockerized instance

```sh
docker pull rvhuang/pathfinding-lab:latest
docker run -d -p 8080:80 pathfinding-lab:latest --name p-lab
```

## License

Copyright © Robert Vandenberg Huang

The project is licensed under the MIT license. Feel free to copy, modify and use it in your computer science homework (grades not guaranteed).
