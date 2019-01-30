using System.Collections.Generic;
using System.Drawing;

namespace Heuristic.PathfindingLab.Models
{
    public class AlgorithmProgressDetail
    {
        public int Level { get; set; }

        public Point Step { get; set; }

        public Point[] Candidates { get; set; }
    }
}