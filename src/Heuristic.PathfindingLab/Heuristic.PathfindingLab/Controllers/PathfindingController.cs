using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Net;

namespace Heuristic.PathfindingLab.Controllers
{
    using Linq;
    using PathfindingLab.Models;
    using PathfindingLab.Helpers;

    [Produces("application/json")]
    [Route("api/[controller]")]
    public class PathfindingController : ControllerBase
    {
        [HttpPost]
        public ResponseBody<AlgorithmSolution> Find([FromBody]PathfindingRequestBody body)
        {
            var settings = body.ToSettings();

            if (!PathfindingSettings.CheckIfValid(settings))
            {
                Response.StatusCode = (int)HttpStatusCode.BadRequest;
                return new ResponseBody<AlgorithmSolution>() { Errors = new[] { ResponseError.InvalidFromAndGoalSettings } };
            }
            try
            {
                var result = AlgorithmCore.Find(settings, body.Map);

                Response.StatusCode = (int)(result.Solution.Any() ? HttpStatusCode.OK : HttpStatusCode.NotFound);
                return new ResponseBody<AlgorithmSolution>() { Data = result };
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
    }
}