using Heuristic.PathfindingLab.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;

namespace Heuristic.PathfindingLab.Controllers
{
    public class MiniController : Controller
    { 
        private readonly static StringValues iframe = new StringValues(new [] 
        { 
            "connect-src https:", 
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' https:", 
            "img-src https: data:", "media-src https: blob:" 
        });

        [HttpGet]
        public IActionResult Index([FromQuery]int w = MapSettings.DefaultMapWidth, [FromQuery]int h = MapSettings.DefaultMapHeight)
        {
#if !DEBUG
            Response.Headers.Add("Content-Security-Policy", string.Join(";", iframe));
#endif
            Response.Headers.Add("X-Content-Type-Options", "nosniff");
            Response.Headers.Add("X-XSS-Protection", "1; mode=block");

            return View(new MapSettings(w, h));
        }
    }
}