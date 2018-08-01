using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;

namespace Heuristic.PathfindingLab.Controllers
{
    using Linq;
    using Models;

    [Produces("application/json")]
    [Route("api/[controller]")]
    public class PathfindingController : ControllerBase
    {
        [HttpPost]
        public IEnumerable<Point> Find([FromBody]PathfindingRequestBody body)
        {
            var start = new Point(body.FromX, body.FromY);
            var goal = new Point(body.GoalX, body.GoalY);
            var boundary = new Rectangle(0, 0, body.Map.Length, body.Map.Max(row => row.Length));
            var unit = 1;
            var obstacles = PathfindingRequestBody.GetAllObstacles(body.Map);
            var queryable = HeuristicSearch.Use(body.Algorithm, start, goal, (step, i) => step.GetFourDirections(unit));
            var solution = from step in queryable.Except(obstacles)
                           where boundary.Contains(step)
                           select step;

            return ApplyHeuristicFunction(solution, body.Heuristics);
        }

        private static HeuristicSearchOrderBy<Point, Point> ApplyHeuristicFunction(HeuristicSearchBase<Point, Point> queryable, string[] heuristicNames)
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