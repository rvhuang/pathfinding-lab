using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;

namespace Heuristic.PathfindingLab.Models
{
    public class MapSettings
    {
        public const int DefaultMapWidth = 40;
        public const int DefaultMapHeight = 20;
        public const int MinMapWidth = 20;
        public const int MinMapHeight = 20;

        private int _width;
        private int _height;

        private IReadOnlyList<Obstacle> _obstacles;
        private IReadOnlyList<PathfindingSettings> _settings;

        [JsonProperty(Required = Required.Default)]
        public IReadOnlyList<Obstacle> Obstacles { get => _obstacles; set => _obstacles = value ?? Array.Empty<Obstacle>(); }

        [JsonProperty(Required = Required.Always)]
        public int Width { get => _width; set => Math.Max(MinMapWidth, value); }

        [JsonProperty(Required = Required.Always)]
        public int Height { get => _height; set => Math.Max(MinMapHeight, value); }

        public MapSettings()
        {
            _width = DefaultMapWidth;
            _height = DefaultMapHeight;
            _obstacles = Array.Empty<Obstacle>();
            _settings = Array.Empty<PathfindingSettings>();
        }

        public MapSettings(int mapWidth, int mapHeight)
        {
            _width = Math.Max(MinMapWidth, mapWidth);
            _height = Math.Max(MinMapHeight, mapHeight);
            _obstacles = Array.Empty<Obstacle>();
            _settings = Array.Empty<PathfindingSettings>();
        }

        public bool CheckIfObstacleValid(Obstacle o)
        {
            return Obstacle.CheckIfValid(o) && o.X < Width && o.Y < Height;
        }

        public bool CheckIfPathfindingSettingsValid(PathfindingSettings s)
        {
            return PathfindingSettings.CheckIfValid(s) && _obstacles.Where(CheckIfObstacleValid).All(o => o.CheckIfPathfindingSettingsValid(s));
        }

        public IEnumerable<Point> GetObstaclePoints()
        {
            foreach (var obstacle in Obstacles)
                if (Obstacle.CheckIfValid(obstacle))
                    yield return new Point(obstacle.X, obstacle.Y);
        }
    }
}