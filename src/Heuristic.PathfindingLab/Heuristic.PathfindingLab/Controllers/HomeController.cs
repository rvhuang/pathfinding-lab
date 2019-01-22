using Microsoft.AspNetCore.Mvc;
using System.Drawing;

namespace Heuristic.PathfindingLab.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Map([FromQuery]int mapWidth, [FromQuery]int mapHeight)
        {
            return PartialView(new Rectangle(0, 0, mapWidth, mapHeight));
        }
    }
}
