using Newtonsoft.Json;

namespace Heuristic.PathfindingLab.Models
{
    using Linq;

    public class PathfindingSettings
    {
        [JsonProperty(Required = Required.Always)]
        public int FromX { get; set; }

        [JsonProperty(Required = Required.Always)]
        public int FromY { get; set; }

        [JsonProperty(Required = Required.Always)]
        public int GoalX { get; set; }

        [JsonProperty(Required = Required.Always)]
        public int GoalY { get; set; }

        [JsonProperty(Required = Required.Default)]
        public string[] Heuristics { get; set; }

        [JsonProperty(Required = Required.Always)]
        public string Algorithm { get; set; }

        public static bool CheckIfValid(PathfindingSettings s)
        {
            if (s == null) return false;
            if (s.FromX < 0 || s.FromY < 0) return false;
            if (s.FromX == s.GoalX && s.FromY == s.GoalY) return false;

            return HeuristicSearch.RegisteredAlgorithms.ContainsKey(s.Algorithm);
        }
    }
}