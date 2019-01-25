using Newtonsoft.Json;

namespace Heuristic.PathfindingLab.Models
{
    public class Obstacle
    {
        [JsonProperty(Required = Required.Always)]
        public int Value { get; set; }

        [JsonProperty(Required = Required.Always)]
        public int X { get; set; }

        [JsonProperty(Required = Required.Always)]
        public int Y { get; set; }
        
        public bool CheckIfPathfindingSettingsValid(PathfindingSettings s)
        {
            return s != null && s.FromX != X && s.FromY != Y && s.GoalX != X && s.GoalY != Y;
        }

        public static bool CheckIfValid(Obstacle o)
        {
            return o != null && o.Value > 0 && o.X >= 0 && o.Y >= 0;
        }
    }
}