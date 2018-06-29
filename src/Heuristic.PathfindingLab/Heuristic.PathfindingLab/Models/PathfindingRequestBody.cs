using LinqToAStar;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;

namespace Heuristic.PathfindingLab.Models
{
    public class PathfindingRequestBody
    {
        public int FromX { get; set; }

        public int FromY { get; set; }

        public int GoalX { get; set; }

        public int GoalY { get; set; }

        public int?[][] Map { get; set; }

        public string[] Heuristics { get; set; }

        public string Algorithm { get; set; }

        public static IEnumerable<Point> GetAllObstacles(int?[][] map)
        {
            for (var y = 0; y < map.Length; y++)
                for (var x = 0; x < map[y].Length; x++)
                    if (map[y][x] == null)
                        yield return new Point(x, y);
        }

        public static HeuristicSearchBase<Point, Point> InitializeSearch(string algorithmName, Point start, Point goal, int unit)
        {
            switch (algorithmName)
            {
                case nameof(HeuristicSearch.AStar):
                    return HeuristicSearch.AStar(start, goal, (s, i) => s.GetFourDirections(unit));

                case nameof(HeuristicSearch.BestFirstSearch):
                    return HeuristicSearch.BestFirstSearch(start, goal, (s, i) => s.GetFourDirections(unit));

                case nameof(HeuristicSearch.IterativeDeepeningAStar):
                    return HeuristicSearch.IterativeDeepeningAStar(start, goal, (s, i) => s.GetFourDirections(unit));

                case nameof(HeuristicSearch.RecursiveBestFirstSearch):
                    return HeuristicSearch.RecursiveBestFirstSearch(start, goal, (s, i) => s.GetFourDirections(unit));
            }
            return HeuristicSearch.AStar(start, goal, (s, i) => s.GetFourDirections(unit));
        }

        public static HeuristicSearchOrderBy<Point, Point> ApplyHeuristicFunction(HeuristicSearchBase<Point, Point> queryable, string[] heuristicNames)
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

                default:
                    orderBy = queryable.OrderBy(p => p.GetManhattanDistance(goal));
                    break;
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

                    default:
                        orderBy = orderBy.ThenBy(p => p.GetManhattanDistance(goal));
                        break;
                }
            }
            return orderBy;
        }
    }
}
