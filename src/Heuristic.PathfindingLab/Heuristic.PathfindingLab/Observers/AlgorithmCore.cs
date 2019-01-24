using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;

namespace Heuristic.PathfindingLab.Observers
{
    using Linq;
    using PathfindingLab.Models;

    public static class AlgorithmCore
    {
        public static AlgorithmSolution Find(PathfindingSettings settings, int[][] map)
        {
            var observer = new AlgorithmObserverFactory();
            var start = new Point(settings.FromX, settings.FromY);
            var goal = new Point(settings.GoalX, settings.GoalY);
            var boundary = new Rectangle(0, 0, map.Max(row => row.Length), map.Length);
            var unit = 1;
            var obstacles = GetAllObstacles(map);
            var queryable = HeuristicSearch.Use(settings.Algorithm, start, goal, (step, i) => step.GetFourDirections(unit), null, observer);
            var solution = ApplyHeuristicFunction(queryable.Except(obstacles).Where(boundary.Contains), settings.Heuristics);

            return new AlgorithmSolution()
            {
                Details = observer.Details,
                Solution = solution.ToArray(),
            };
        }

        public static HeuristicSearchBase<Point, Point> ApplyHeuristicFunction(HeuristicSearchBase<Point, Point> queryable, string[] heuristicNames)
        {
            var orderBy = default(HeuristicSearchOrderBy<Point, Point>);
            var goal = queryable.To;

            switch (heuristicNames.FirstOrDefault())
            {
                case nameof(PointExtensions.GetChebyshevDistance):
                    orderBy = queryable.OrderBy(p => p.GetChebyshevDistance(goal));
                    break;

                case nameof(PointExtensions.GetEuclideanDistance):
                    orderBy = queryable.OrderBy(p => p.GetEuclideanDistance(goal));
                    break;

                case nameof(PointExtensions.GetManhattanDistance):
                    orderBy = queryable.OrderBy(p => p.GetManhattanDistance(goal));
                    break;

                default:
                    return queryable;
            }
            foreach (var heuristicName in heuristicNames.Skip(1).Take(2))
            {
                switch (heuristicName)
                {
                    case nameof(PointExtensions.GetChebyshevDistance):
                        orderBy = orderBy.ThenBy(p => p.GetChebyshevDistance(goal));
                        break;

                    case nameof(PointExtensions.GetEuclideanDistance):
                        orderBy = orderBy.ThenBy(p => p.GetEuclideanDistance(goal));
                        break;

                    case nameof(PointExtensions.GetManhattanDistance):
                        orderBy = orderBy.ThenBy(p => p.GetManhattanDistance(goal));
                        break;

                    default:
                        continue;
                }
            }
            return orderBy;
        }

        public static IEnumerable<Point> GetAllObstacles(int[][] map)
        {
            for (var y = 0; y < map.Length; y++)
                for (var x = 0; x < map[y].Length; x++)
                    if (map[y][x] < 0)
                        yield return new Point(x, y);
        }
    }
}