using Heuristic.PathfindingLab.Models;
using Microsoft.AspNetCore.Mvc;

namespace Heuristic.PathfindingLab.Controllers
{
    public class MiniController : Controller
    {
        [HttpGet]
        public IActionResult Index([FromQuery]int w = MapSettings.DefaultMapWidth, [FromQuery]int h = MapSettings.DefaultMapHeight)
        {
            return View(new MapSettings(w, h));
        }
    }
}