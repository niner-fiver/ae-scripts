/**
 * Distribute Selected Layers Evenly Between First and Last
 *
 * - First and last layers stay fixed
 * - Even spacing between intermediate layer edges
 * - Horizontal or Vertical via ScriptUI dropdown
 * - Works with shape layers by using layer bounds
 */

function distributeLayersByBounds_UI() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Select a composition first.");
        return;
    }

    var layers = comp.selectedLayers;
    if (layers.length < 3) {
        alert("Select at least 3 layers.");
        return;
    }

    // UI
    var win = new Window("dialog", "Distribute Layers");
    var dropdown = win.add("dropdownlist", undefined, ["Horizontal", "Vertical"]);
    dropdown.selection = 0;
    var btns = win.add("group");
    btns.add("button", undefined, "OK");
    btns.add("button", undefined, "Cancel", {name: "cancel"});
    if (win.show() !== 1) return;

    var isHorizontal = dropdown.selection.index === 0;

    app.beginUndoGroup("Distribute Layers by Bounding Edges");

    // Collect bounds using a more reliable method for shape layers
    var boundsData = [];
    for (var i = 0; i < layers.length; i++) {
        var lyr = layers[i];
        
        // Get source rectangle with extents
        var rect = lyr.sourceRectAtTime(comp.time, true); // true = include effects and masks
        var pos = lyr.property("ADBE Transform Group").property("ADBE Position").value;
        var anchorPoint = lyr.property("ADBE Transform Group").property("ADBE Anchor Point").value;
        var scale = lyr.property("ADBE Transform Group").property("ADBE Scale").value;
        
        // Calculate actual world-space bounds accounting for anchor point and scale
        var scaleX = scale[0] / 100;
        var scaleY = scale[1] / 100;
        
        var width = rect.width * scaleX;
        var height = rect.height * scaleY;
        
        // Position of left edge = position - (anchorPoint.x - rect.left) * scaleX
        var minX = pos[0] + (rect.left - anchorPoint[0]) * scaleX;
        var maxX = minX + width;
        
        var minY = pos[1] + (rect.top - anchorPoint[1]) * scaleY;
        var maxY = minY + height;

        boundsData.push({
            layer: lyr,
            rect: rect,
            pos: pos,
            anchorPoint: anchorPoint,
            scale: scale,
            width: width,
            height: height,
            minX: minX,
            maxX: maxX,
            minY: minY,
            maxY: maxY
        });
    }

    // Sort layers by axis
    if (isHorizontal) {
        boundsData.sort(function(a,b){ return a.minX - b.minX; });
    } else {
        boundsData.sort(function(a,b){ return a.minY - b.minY; });
    }

    var first = boundsData[0];
    var last = boundsData[boundsData.length - 1];
    var innerLayers = boundsData.slice(1, boundsData.length-1);

    if (innerLayers.length === 0) {
        app.endUndoGroup();
        return;
    }

    // Calculate total space between first and last edges
    var totalSpan = isHorizontal
        ? (last.minX - first.maxX)
        : (last.minY - first.maxY);

    // Calculate total size of all inner layers
    var totalInnerSize = 0;
    for (var i = 0; i < innerLayers.length; i++) {
        totalInnerSize += isHorizontal
            ? innerLayers[i].width
            : innerLayers[i].height;
    }

    // Calculate gap size
    var numGaps = innerLayers.length + 1;
    var gapSize = (totalSpan - totalInnerSize) / numGaps;

    // Start cursor at the end of first layer
    var cursor = isHorizontal ? first.maxX : first.maxY;

    // Position each inner layer
    for (var i = 0; i < innerLayers.length; i++) {
        var item = innerLayers[i];
        
        // Move cursor by gap
        cursor += gapSize;
        
        var newPos = item.pos.slice();
        
        if (isHorizontal) {
            // We want minX to be at cursor
            // minX = pos[0] + (rect.left - anchorPoint[0]) * scaleX
            // So: pos[0] = cursor - (rect.left - anchorPoint[0]) * scaleX
            var scaleX = item.scale[0] / 100;
            newPos[0] = cursor - (item.rect.left - item.anchorPoint[0]) * scaleX;
            cursor += item.width;
        } else {
            // We want minY to be at cursor
            var scaleY = item.scale[1] / 100;
            newPos[1] = cursor - (item.rect.top - item.anchorPoint[1]) * scaleY;
            cursor += item.height;
        }

        item.layer.property("ADBE Transform Group").property("ADBE Position").setValue(newPos);
    }

    app.endUndoGroup();
}

distributeLayersByBounds_UI();