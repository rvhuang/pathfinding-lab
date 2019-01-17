using Microsoft.AspNetCore.Mvc;
using System;
using System.Drawing;
using System.Linq;
using System.Net;

namespace Heuristic.PathfindingLab.Controllers
{
    using Linq;
    using PathfindingLab.Models;
    using PathfindingLab.Observers;

    [Produces("application/json")]
    [Route("api/[controller]")]
    public class PathfindingController : ControllerBase
    {
        [HttpPost]
        public ResponseBody<AlgorithmSolution> Find([FromBody]PathfindingRequestBody body)
        {
            var observer = new AlgorithmObserverFactory();
            var start = new Point(body.FromX, body.FromY);
            var goal = new Point(body.GoalX, body.GoalY);
            var boundary = new Rectangle(0, 0, body.Map.Length, body.Map.Max(row => row.Length));
            var unit = 1;
            var obstacles = PathfindingRequestBody.GetAllObstacles(body.Map);
            var queryable = HeuristicSearch.Use(body.Algorithm, start, goal, (step, i) => step.GetFourDirections(unit), null, observer);
            var solution = ApplyHeuristicFunction(queryable.Except(obstacles).Where(boundary.Contains), body.Heuristics).ToArray();

            try
            {
                return new ResponseBody<AlgorithmSolution>()
                {
                    Data = new AlgorithmSolution()
                    {
                        Details = observer.Details,
                        Solution = solution
                    }
                };
            }
            catch (InvalidOperationException)
            {
                Response.StatusCode = (int)HttpStatusCode.BadRequest;
                return new ResponseBody<AlgorithmSolution>() { };
            }
            catch (Exception)
            {
                Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                return new ResponseBody<AlgorithmSolution>() { };
            }
        }

        private static HeuristicSearchBase<Point, Point> ApplyHeuristicFunction(HeuristicSearchBase<Point, Point> queryable, string[] heuristicNames)
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
    }
}