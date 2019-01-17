using System.Collections.Generic;
using System.Drawing;

namespace Heuristic.PathfindingLab.Models
{
    public class AlgorithmSolution
    {
        public IList<Point> Solution { get; set; }

        public IList<AlgorithmProgressDetail> Details { get; set; }
    }
}
