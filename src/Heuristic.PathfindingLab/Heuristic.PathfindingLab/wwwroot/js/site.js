var tileSize = 32;
var mapSize = 20;
var core = new Core(mapSize, mapSize);
var current = new PathfindingRequestBody();

$(document).ready(function () {
    
    var cursorLayer = new CursorLayer(document.getElementById('cursor'), document.getElementById('mouse-cursor'), tileSize, tileSize, mapSize, mapSize);
    var foregroundLayer = new ForegroundLayer(cursorLayer, document.getElementById('foreground'), [
        "images/barricadeMetal.png",
        "images/barricadeWood.png",
        "images/crateMetal.png",
        "images/crateWood_side.png",
        "images/crateWood.png",
        "images/crateMetal_side.png"
    ]);
    foregroundLayer.objectPracingPredicate = (i, j) => core.placeObstacle(i, j);
    foregroundLayer.pathPlacingCallback = function(i, j) {
        if (core.isObstacle(i, j)) {
            return;
        }
        if (core.createPathfindingRequestBody(current, i, j)) {
            var heuristics = current.heuristics.slice();
            var algorithm = current.algorithm;

            cursorLayer.placeTile(i, j, PathfindingHistory.getAlgorithmPathColor(current.algorithm));
            $.ajax({
                type: "POST",
                url: "api/pathfinding/",
                data: JSON.stringify(current),
                contentType: "application/json",
                success: function (data) {
                    var path = core.assignDirections(data);

                    if (path.length > 0) {
                        var history = new PathfindingHistory(path, heuristics, algorithm);

                        foregroundLayer.placePath(path, step => "images/tileGrass_road_" + step.getDirectionShortName() + ".png");
                        if (cursorLayer.paths.length > 7) {
                            $("#histories button:first-child").fadeOut(500, function () {
                                $(this).remove();
                                if (cursorLayer.paths[0].isVisible) {
                                    cursorLayer.togglePath(0);
                                }
                                cursorLayer.paths.shift();
                            });
                        }
                        cursorLayer.paths.push(history);
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
                                updateOptions(cursorLayer.paths[index]);
                                updateExpressions(cursorLayer.paths[index]);
                            }
                            else { // Restore to current state.
                                updateOptions(current);
                                updateExpressions(current);
                            }
                        }); 
                    }
                    updateExpressions(current);
                }
            });
        }
        else {            
            cursorLayer.placeTile(i, j, PathfindingHistory.getAlgorithmPathColor(current.algorithm));
        }
    };
    $('#btnClear').click(function (event) {
        core.clearObstacles();
        foregroundLayer.clearMap();
        cursorLayer.clearTiles();
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
            foregroundLayer.placeStep(step, "images/tileGrass_road_" + step.getDirectionShortName() + ".png");
        });
    });
    $('#btnDownload').click(function (event) {
        this.href = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(document.getElementById("map").outerHTML);
    }); /*
    $('#btnDownloadJson').click(function (event) {
        this.href = "data:text/json;charset=UTF-8," + encodeURIComponent(JSON.stringify(current));
    }); */
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
        if (current.fromX !== current.goalX && current.FromY !== current.goalY) {
            updateExpressions(current);
        }
    }).click(function (event) {
        if (!this.checked && current.heuristics.length == 1) {
            $(this).parent().css("color", "red"); 
            event.preventDefault(); 
            return false;
        }
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
    $("#exampleSelectMany").find("code").text(pathfinding.toSelectManyExpression(mapSize, mapSize).join('\r\n'));
    $("#exampleExcept").find("code").text(pathfinding.toExceptExpression(mapSize, mapSize).join('\r\n'));
    $("#exampleWhere").find("code").text(pathfinding.toWhereOnlyExpression(mapSize, mapSize).join('\r\n'));
    $("pre code").each(function(i, block) {
        hljs.highlightBlock(block);
    });
}
