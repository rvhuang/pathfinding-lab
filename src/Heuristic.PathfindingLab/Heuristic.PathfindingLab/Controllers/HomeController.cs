using Heuristic.PathfindingLab.Models;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace Heuristic.PathfindingLab.Controllers
{
    public class HomeController : Controller
    {
        private readonly static string[] mimes = new[] { "application/json", "text/json" };
        private readonly static HttpClient client = new HttpClient() { Timeout = TimeSpan.FromSeconds(4) };

        [HttpGet]
        public IActionResult Index([FromQuery]int w = MapSettings.DefaultMapWidth, [FromQuery]int h = MapSettings.DefaultMapHeight)
        {
            return View(new MapSettings(w, h));
        }

        [HttpGet]
        public async Task<IActionResult> Load(string from)
        {
            var uri = default(Uri);

            if (!Uri.TryCreate(from, UriKind.Absolute, out uri) || uri.Scheme != Uri.UriSchemeHttp || uri.Scheme != Uri.UriSchemeHttps)
                return View(nameof(Index), new MapSettings());
            try
            {
                using (var response = await client.GetAsync(from))
                    if (mimes.Any(response.Content.Headers.ContentType.MediaType.StartsWith))
                        return View(nameof(Index), await response.Content.ReadAsAsync<MapSettings>());
            }
            catch
            {
                return View(nameof(Index), new MapSettings()); // TODO
            }
            return View(nameof(Index), new MapSettings());
        }

        [HttpGet]
        public IActionResult Map([FromQuery]int w = MapSettings.DefaultMapWidth, [FromQuery]int h = MapSettings.DefaultMapHeight)
        {
            return PartialView(new MapSettings(w, h));
        }
    }
}