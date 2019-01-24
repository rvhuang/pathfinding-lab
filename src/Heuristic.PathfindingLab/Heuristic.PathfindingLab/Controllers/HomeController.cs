using Heuristic.PathfindingLab.Models;
using Microsoft.AspNetCore.Mvc;

namespace Heuristic.PathfindingLab.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index([FromQuery]int w = MapSettings.DefaultMapWidth, [FromQuery]int h = MapSettings.DefaultMapHeight)
        {
            return View(new MapSettings(w, h));
        }

        public IActionResult Map([FromQuery]int w = MapSettings.DefaultMapWidth, [FromQuery]int h = MapSettings.DefaultMapHeight)
        {
            return PartialView(new MapSettings(w, h));
        }
    }
}