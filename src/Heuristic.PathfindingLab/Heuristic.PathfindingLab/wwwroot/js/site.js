var tileSize = 32;
var mapSize = 20;
var core = new Core(40, 20);
var current = new PathfindingRequestBody();

$(document).ready(function () {
    
    var cursorLayer = new CursorLayer(document.getElementById('cursor'), document.getElementById('mouse-cursor'), tileSize, tileSize, 40, 20);
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
    cursorLayer.showDetailDescription = function(step) {
        $("#description").text(step.describes());
    };
    foregroundLayer.objectPracingPredicate = (i, j) => core.placeObstacle(i, j);
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
                        var path = core.assignDirections(solution);

                        if (path.length > 0) {
                            var history = new PathfindingHistory(path, heuristics, algorithm, response.data.details);

                            foregroundLayer.placePath(path, step => "path-" + step.getDirectionShortName());
                            if (cursorLayer.histories.length > 7) {
                                $("#histories button:first-child").fadeOut(500, function () {
                                    $(this).remove();
                                    if (cursorLayer.histories[0].isVisible) {
                                        cursorLayer.togglePath(0);
                                    }
                                    cursorLayer.histories.shift();
                                });
                            }
                            cursorLayer.histories.push(history);
                            cursorLayer.removeTile(path[0].x, path[0].y);
                            cursorLayer.removeTile(path[path.length - 1].x, path[path.length - 1].y);

                            var btn = $("#historyTemplate button:first-child").clone();

                            btn.children('[data-field="PathColor"]').css("color", history.color);
                            btn.children('[data-field="AlgorithmShortName"]').text(history.algorithmShortName);
                            btn.children('[data-field="Path"]').text("(" + history.path.length + ")");
                            btn.appendTo("#histories");
                            btn.click(function (e) {
                                var index = $(this).index();

                                if (cursorLayer.togglePath(index)) {
                                    updateOptions(cursorLayer.histories[index]);
                                    updateExpressions(cursorLayer.histories[index]);
                                }
                                else { // Restore to current state.
                                    updateOptions(current);
                                    updateExpressions(current);
                                }
                            });
                        } else { // Path not found
                            cursorLayer.removeTile(path[0].x, path[0].y);
                            cursorLayer.removeTile(path[path.length - 1].x, path[path.length - 1].y);
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
    $('#btnClear').click(function (event) {
        core.clearObstacles();
        foregroundLayer.clearMap();
        cursorLayer.clearTiles();

        $("#description").text("");
    });
    $('#btnSave').click(function (event) {
        core.saveMap();
    });
    $('#btnLoad').click(function (event) {
        foregroundLayer.clearMap();
        core.clearObstacles();
        core.loadMap(function(x, y) { 
            foregroundLayer.placeObject(x, y);
        },
        function (step) { 
            foregroundLayer.placeStep(step, "path-" + step.getDirectionShortName());
        });
    });
    $('#btnDownload').click(function (event) {
        this.href = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(document.getElementById("map").outerHTML);
    });
    $('#btnDownloadJson').click(function (event) {
        this.href = "data:text/json;charset=UTF-8," + encodeURIComponent(JSON.stringify(current));
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
