using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Drawing;

namespace Heuristic.PathfindingLab.Observers
{
    using Linq;
    using Linq.Algorithms;
    using PathfindingLab.Models;

    public class AlgorithmObserverFactory : IAlgorithmObserverFactory<Point>
    {
        public ObservableCollection<AlgorithmProgressDetail> Details { get; private set; }

        public ISet<Point> Estimated { get; private set; }

        public AlgorithmObserverFactory()
        {
            Details = new ObservableCollection<AlgorithmProgressDetail>();
            Estimated = new HashSet<Point>();
        }

        IProgress<AlgorithmState<TFactor, Point>> IAlgorithmObserverFactory<Point>.Create<TFactor>(HeuristicSearchBase<TFactor, Point> source)
        {
            var progress = new AlgorithmObserver<TFactor>();

            Details.Clear();
            progress.Callback = ProgressCallback;

            return progress;
        }

        private void ProgressCallback(AlgorithmProgressDetail detail)
        {
            Details.Add(detail);
            Estimated.UnionWith(detail.Candidates);
        }
    }
}