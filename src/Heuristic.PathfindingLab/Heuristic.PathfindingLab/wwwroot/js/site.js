var tileSize = 32; 
var core = typeof mapSettings !== "undefined" ? new Core(mapSettings.width, mapSettings.height) : new Core(40, 20);
var current = new PathfindingRequestBody();

$(document).ready(function () {
    var cursorLayer = new CursorLayer(document.getElementById('cursor'), document.getElementById('mouse-cursor'), tileSize, tileSize, core.mapWidth, core.mapHeight);
    var foregroundLayer = new ForegroundLayer(cursorLayer, document.getElementById('foreground'), [
        "obstacle-0",
        "obstacle-1",
        "obstacle-2",
        "obstacle-3",
        "obstacle-4",
        "obstacle-5",
        "obstacle-6",
        "obstacle-7",
        "obstacle-8",
        "obstacle-9",
        "obstacle-10",
        "obstacle-11",
        "obstacle-12",
        "obstacle-13",
        "obstacle-14",
        "obstacle-15",
        "obstacle-16",
        "obstacle-17",
        "obstacle-18",
        "obstacle-19"
    ]);
    var chart = new Chart("chart", 500, 300);
    if (typeof mapSettings !== "undefined") {
        mapSettings.obstacles.forEach(function (o) {
            core.placeObstacle(o.x, o.y, o.value);
            foregroundLayer.obstacle = o.value;
            foregroundLayer.placeObject(o.x, o.y);
        });
    }
    cursorLayer.showDetailDescription = function(step) {
        $("#description").text(step.describes());
    };
    foregroundLayer.objectPracingPredicate = (i, j, obstacle) => core.placeObstacle(i, j, obstacle);
    foregroundLayer.pathPlacingCallback = function(i, j) {
        if (core.isObstacle(i, j)) {
            return;
        }
        switch (core.createPathfindingRequestBody(current, i, j)) {
            case PathfindingRequestStatus.Ready:
                var heuristics = current.heuristics.slice();
                var algorithm = current.algorithm;

                cursorLayer.placeTile(i, j, PathfindingHistory.getAlgorithmPathColor(current.algorithm));
                $.ajax({
                    type: "POST",
                    url: "api/pathfinding/",
                    data: JSON.stringify(current),
                    contentType: "application/json",
                    success: function (response) {
                        var solution = response.data.solution;
                        var assigned = core.assignDirections(solution);
                        var history = new PathfindingHistory(solution, heuristics, algorithm, response.data.details);
                        
                        chart.updateStatistics(response.data.details, PathfindingHistory.getAlgorithmPathColor(current.algorithm), history.getSolutionTiles());
                        foregroundLayer.placePath(assigned, step => step.getDirectionShortName());

                        if (cursorLayer.histories.length > 5) {
                            $("#histories button:first-child").fadeOut(500, function () {
                                $(this).remove();
                                if (cursorLayer.histories[0].isVisible) {
                                    cursorLayer.togglePath(0);
                                }
                                cursorLayer.histories.shift();
                            });
                        }
                        cursorLayer.histories.push(history);
                        cursorLayer.clearAnchors();

                        var btn = $("#historyTemplate button:first-child").clone();

                        btn.children('[data-field="PathColor"]').css("color", history.color);
                        btn.children('[data-field="AlgorithmShortName"]').text(history.algorithmShortName);
                        btn.children('[data-field="Path"]').text("(" + history.path.length + ")");
                        btn.appendTo("#histories");
                        btn.click(function (e) {
                            var index = $(this).index();
                            var toggled = cursorLayer.histories[index];

                            if (cursorLayer.togglePath(index)) {
                                updateOptions(toggled);
                                updateExpressions(toggled);
                                // chart.updateStatistics(null, PathfindingHistory.getAlgorithmPathColor(toggled.algorithm), toggled.getSolutionTiles());
                            }
                            else { // Restore to current state.
                                updateOptions(current);
                                updateExpressions(current);
                                // chart.updateStatistics(null, PathfindingHistory.getAlgorithmPathColor(current.algorithm), current.getSolutionTiles());
                            }
                        });
                        if (solution.length === 0) { // Path not found
                            let msg = "// No solution is found.";

                            $("#exampleSelectMany").find("code").text(msg);
                            $("#exampleExcept").find("code").text(msg);
                            $("#exampleWhere").find("code").text(msg);
                        }
                        updateExpressions(current);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        var msg = "";
                        switch (jqXHR.status) {
                            case 400:
                                msg = "// The selected algorithm needs at least one Heuristic function.";
                                $(':input[name="heuristic"]').parent().css("color", "red");
                                break;
                            case 404:
                                msg = "// No solution is found.";
                                cursorLayer.clearAnchors();
                                break;
                            case 500:
                                msg = "// Something went wrong. Please try again later or report an issue at GitHub.";
                                break;
                        }
                        $("#exampleSelectMany").find("code").text(msg);
                        $("#exampleExcept").find("code").text(msg);
                        $("#exampleWhere").find("code").text(msg);
                    },
                    complete: function () {
                        $("#description").text("");
                    }
                });
                break;
            case PathfindingRequestStatus.Initiated:
                cursorLayer.placeTile(i, j, PathfindingHistory.getAlgorithmPathColor(current.algorithm));
                break;

            case PathfindingRequestStatus.None:
                cursorLayer.removeTile(i, j);
                break;
        }
    };
    $('#btnUndo').click(function (event) {
        if (cursorLayer.histories[cursorLayer.histories.length - 1].isVisible) {
            cursorLayer.togglePath(cursorLayer.histories.length - 1);
        }

        var history = cursorLayer.histories.pop();
        var steps = core.removeDirections(history.steps);

        foregroundLayer.removePath(steps, step => step.getDirectionShortName());

        $("#histories button:last-child").fadeOut(300, function () {
            $(this).remove();
        });
    });
    $('#btnClear').click(function (event) {
        core.clearObstacles();
        foregroundLayer.clearMap();
        cursorLayer.clearTiles();

        $("#description").text("");
    });
    $('#btnFindPath').click(function (event) { 
        foregroundLayer.isPathfindingOnly = !foregroundLayer.isPathfindingOnly; 
    });
    $('#btnDelObstacles').click(function (event) {
        var obstacles = core.clearObstacles();

        for (let obstacle of obstacles) {
            foregroundLayer.removeObject(obstacle.x, obstacle.y);
        }
    });
    $(':input[name="algorithm"]').change(function (event) {
        current.algorithm = this.value;
        if (current.fromX !== current.goalX && current.FromY !== current.goalY) {
            updateExpressions(current);
        }
        $("#mouse-cursor").attr("fill", PathfindingHistory.getAlgorithmPathColor(this.value));
    });
    $(':input[name="heuristic"]').change(function (event) {
        if (this.checked) {
            current.heuristics.push(this.value);
        }
        else {
            const index = current.heuristics.indexOf(this.value);
            if (index !== -1) {
                current.heuristics.splice(index, 1);
            }
        }
        if (current.heuristics.length === 0) {
            $('input[name="algorithm"][value="AStar"]').parent().children("span").text("Dijkstra");
        }
        else {
            $('input[name="algorithm"][value="AStar"]').parent().children("span").text("A*");
        }
        if (current.fromX !== current.goalX && current.FromY !== current.goalY) {
            updateExpressions(current);
        }
    }).click(function (event) {
        $("div.checkbox").children("label").css("color", ""); 
        return true;
    });
    $('[data-toggle="popover"]').popover();
    $('[data-toggle="tooltip"]').tooltip({
        container: "body",
        placement: "bottom"
    });
});

function updateOptions(pathfinding) {
    $(':input[name="heuristic"]').each(function (i, element) {
        $(element).prop("checked", pathfinding.heuristics.indexOf($(element).val()) >= 0);
    }); 
    $(':input[name="algorithm"][value="' + pathfinding.algorithm + '"]').prop("checked", true);
}

function updateExpressions(pathfinding) {
    $("#exampleSelectMany").find("code").text(pathfinding.toSelectManyExpression(40, 20).join('\r\n'));
    $("#exampleExcept").find("code").text(pathfinding.toExceptExpression(40, 20).join('\r\n'));
    $("#exampleWhere").find("code").text(pathfinding.toWhereOnlyExpression(40, 20).join('\r\n'));
    $("pre code").each(function(i, block) {
        hljs.highlightBlock(block);
    });
}
