using System;
using System.Drawing;
using System.Linq;

namespace Heuristic.PathfindingLab.Observers
{
    using Linq.Algorithms;
    using PathfindingLab.Models;

    public class AlgorithmObserver<TFactor> : IProgress<AlgorithmState<TFactor, Point>>
    {
        public Action<AlgorithmProgressDetail> Callback { get; set; }

        public void Report(AlgorithmState<TFactor, Point> p)
        {
            Callback(new AlgorithmProgressDetail()
            {
                Level = p.Node != null ? p.Node.Level : -1,
                Step = p.Node != null ? p.Node.Step : new Point(-1, -1),
                Candidates = p.Candidates.Select(c => c.Step).ToArray()
            });
        }
    }
}