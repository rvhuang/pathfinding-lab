class Chart {
    private static readonly margin = { top: 20, left: 20, right: 20, bottom: 20 };

    private readonly elementId: string;
    private readonly containerWidth: number;
    private readonly containerHeight: number;
    private readonly width: number;
    private readonly height: number;

    constructor(elementId: string, containerWidth: number, containerHeight: number) {
        this.elementId = elementId;
        this.containerWidth = containerWidth;
        this.containerHeight = containerHeight;
        this.width = containerWidth - Chart.margin.left - Chart.margin.right;
        this.height = containerHeight - Chart.margin.top - Chart.margin.bottom;
    }

    public updateStatistics(data: Array<Detail>, color: string, tiles: ReadonlyArray<SolutionTile>) {
        let parent = d3.select("#" + this.elementId);
        let svg = parent.select("svg");

        if (svg.node() == null) {
            svg = parent.append("svg").attr("width", this.containerWidth).attr("height", this.containerHeight);
        }

        let g = svg.select('g');

        if (g.node() != null) {
            g.remove();
        }

        g = svg.append('g').attr('transform', 'translate(' + Chart.margin.left + ', ' + Chart.margin.top + ')');

        let xDomain = d3.extent(data, function (d, i) { return i; })
        let yDomain = d3.extent(data, function (d) { return d.candidates.length; });

        let xScale = d3.scaleLinear().range([0, this.width]).domain(xDomain);
        let yScale = d3.scaleLinear().range([this.height, 0]).domain(yDomain);

        let xAxis = d3.axisBottom(xScale);
        let yAxis = d3.axisLeft(yScale);

        var line = d3.line<Detail>()
            .x(function (d, i) { return xScale(i); })
            .y(function (d) { return yScale(d.candidates.length); });

        g.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0, ' + this.height + ')')
            .call(xAxis)
            .append('text')
            .attr('x', this.containerWidth - 100)
            .attr('y', -15)
            .attr('dx', '.71em')
            .attr('dy', '.71em')
            .style("fill", "darkgreen")
            .text("Index of explored node");

        g.append('g')
            .attr('class', 'y axis')
            .call(yAxis)
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '.71em')
            .attr('text-anchor', 'end')
            .style("fill", "darkgreen")
            .text("Nodes on open list");

        g.append<SVGPathElement>('path')
            .datum(data)
            .attr('class', 'line')
            .attr('d', line(data))
            .style('stroke', color);

        g.selectAll<SVGCircleElement, Detail>('circle').data(data).enter().append('circle')
            .attr('cx', function (d, i) { return xScale(i); })
            .attr('cy', function (d) { return yScale(d.candidates.length); })
            .attr('r', 4)
            .attr('class', 'circle')
            .style('stroke', color);

        // focus tracking
        var focus = g.append('g').style('display', 'none');
        var focusLineX = focus.append('line')
            .attr('id', 'focusLineX')
            .attr('class', 'focusLine');
        var focusLineY = focus.append('line')
            .attr('id', 'focusLineY')
            .attr('class', 'focusLine');
        var focusCircle = focus.append('circle')
            .attr('id', 'focusCircle')
            .attr('r', 5)
            .attr('class', 'circle');

        g.append<SVGRectElement>('rect')
            .attr('class', 'overlay')
            .attr('width', this.width)
            .attr('height', this.height)
            .on('mouseover', function () { focus.style('display', null); })
            .on('mouseout', function () {
                var mouse = d3.mouse(this);
                var mouseX = xScale.invert(mouse[0]);
                var i = Math.round(mouseX); 

                for (let tile of tiles) {
                    for (let candidate of data[i].candidates) {
                        if (tile.x === candidate.x && tile.y === candidate.y) {
                            tile.hide();
                        }
                        else {
                            tile.show();
                        }
                    }
                }
                focus.style('display', 'none');
            })
            .on('mousemove', function () {
                var mouse = d3.mouse(this);
                var mouseX = xScale.invert(mouse[0]);
                var i = Math.round(mouseX);
                var x = xScale(i);
                var y = yScale(data[i].candidates.length);

                focusCircle.attr('cx', x).attr('cy', y).style('fill', color);
                focusLineX.attr('x1', x).attr('y1', yScale(yDomain[0])).attr('x2', x).attr('y2', yScale(yDomain[1]));
                focusLineY.attr('x1', xScale(xDomain[0])).attr('y1', y).attr('x2', xScale(xDomain[1])).attr('y2', y);
                 
                for (let tile of tiles) {
                    for (let candidate of data[i].candidates) {
                        if (tile.x === candidate.x && tile.y === candidate.y) {
                            tile.show();
                        }
                        else {
                            tile.hide();
                        }
                    }
                } 
            });
    }
}