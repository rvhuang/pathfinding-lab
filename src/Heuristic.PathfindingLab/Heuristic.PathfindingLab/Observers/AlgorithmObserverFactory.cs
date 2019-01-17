using System;
using System.Collections.ObjectModel;
using System.Drawing;

namespace Heuristic.PathfindingLab.Observers
{
    using Linq;
    using Linq.Algorithms;
    using PathfindingLab.Models;

    public class AlgorithmObserverFactory : IAlgorithmObserverFactory<Point>
    {
        public ObservableCollection<AlgorithmProgressDetail> Details { get; }

        public AlgorithmObserverFactory()
        {
            Details = new ObservableCollection<AlgorithmProgressDetail>();
        }

        IProgress<AlgorithmState<TFactor, Point>> IAlgorithmObserverFactory<Point>.Create<TFactor>(HeuristicSearchBase<TFactor, Point> source)
        {
            var progress = new AlgorithmObserver<TFactor>();

            Details.Clear();
            progress.Callback = Details.Add;

            return progress;
        }
    }
}