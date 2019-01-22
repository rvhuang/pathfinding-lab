using Newtonsoft.Json;
using System.Collections.Generic;
using System.Drawing;

namespace Heuristic.PathfindingLab.Models
{
    public class PathfindingRequestBody
    {
        [JsonProperty(Required = Required.Always)]
        public int FromX { get; set; }

        [JsonProperty(Required = Required.Always)]
        public int FromY { get; set; }

        [JsonProperty(Required = Required.Always)]
        public int GoalX { get; set; }

        [JsonProperty(Required = Required.Always)]
        public int GoalY { get; set; }

        [JsonProperty(Required = Required.Always)]
        public int?[][] Map { get; set; }

        [JsonProperty(Required = Required.Always)]
        public string[] Heuristics { get; set; }

        [JsonProperty(Required = Required.Always)]
        public string Algorithm { get; set; }

        public static IEnumerable<Point> GetAllObstacles(int?[][] map)
        {
            for (var y = 0; y < map.Length; y++)
                for (var x = 0; x < map[y].Length; x++)
                    if (map[y][x] == null || map[y][x].GetValueOrDefault() < 0)
                        yield return new Point(x, y);
        }
    }
}