using LinqToAStar;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;

namespace Heuristic.PathfindingLab.Controllers
{
    using Models;

    [Produces("application/json")]
    [Route("api/[controller]")]
    public class PathfindingController : ControllerBase
    {
        [HttpPost]
        public IEnumerable<Point> Find([FromBody]PathfindingRequestBody body)
        {
            var unit = 1;
            var start = new Point(body.FromX, body.FromY);
            var goal = new Point(body.GoalX, body.GoalY);
            var boundary = new Rectangle(0, 0, body.Map.Length, body.Map.Max(row => row.Length));
            var obstacles = PathfindingRequestBody.GetAllObstacles(body.Map);
            var queryable = PathfindingRequestBody.InitializeSearch(body.Algorithm, start, goal, unit).Except(obstacles).Where(boundary.Contains);
            var solution = PathfindingRequestBody.ApplyHeuristicFunction(queryable, body.Heuristics);

            return solution;
        }
    }
}