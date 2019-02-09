# Pathfinding Laboratory

[![Docker Image Size](https://images.microbadger.com/badges/image/rvhuang/pathfinding-lab.svg)](https://microbadger.com/images/rvhuang/pathfinding-lab "Get your own image badge on microbadger.com") [![Docker Image Version](https://images.microbadger.com/badges/version/rvhuang/pathfinding-lab.svg)](https://microbadger.com/images/rvhuang/pathfinding-lab "Get your own version badge on microbadger.com")

A playground where you can run, test and compare pathfinding algorithms and heuristic functions. 

Visit [the website](https://pathfinding-lab.codedwith.fun/) running on DigitalOcean and try it out.

The project is written in ASP.NET Core MVC/Web API and TypeScript. The algorithm part of the project is based on [LINQ to A\*](https://github.com/rvhuang/linq-to-astar): a POC about pathfinding algorithms written in C# and used with LINQ expressions.

## Features

* An editable, retro RPG-style map where you can place various obstacles, creating whatever maze you want.
* Five algorithms and three heuristic functions available for playing with (more to be added).
* Right-clicking on two positions to find a path (can be undone).
* An overlay grid with animation to show expanded nodes and depths(levels).
* A line chart that fully illustrates the evolution of Open List during the process.
* A code snippet that demonstrates LINQ statement using LINQ to A*.

## Build the project

```sh
cd src/Heuristic.PathfindingLab/Heuristic.PathfindingLab/
npm i -s d3
npm i -s @types/d3
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
