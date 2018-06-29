using Microsoft.AspNetCore.Mvc;

namespace Heuristic.PathfindingLab.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
