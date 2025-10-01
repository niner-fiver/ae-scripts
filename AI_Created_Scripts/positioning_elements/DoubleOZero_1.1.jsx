// Set X, Y, and Z Position of a single selected layer to 0
// Works both with and without Separate Dimensions

// 2025 Josh Spivey with ChatGPT and Claude

(function setPositionToZero() {
    var comp = app.project.activeItem;

    if (!(comp && comp instanceof CompItem)) {
        alert("Please select a composition first.");
        return;
    }

    var layers = comp.selectedLayers;

    if (layers.length !== 1) {
        alert("Please select exactly ONE layer.");
        return;
    }

    app.beginUndoGroup("Set Position to 0");

    try {
        var layer = layers[0];
        var posProp = layer.property("ADBE Transform Group").property("ADBE Position");

        if (posProp.dimensionsSeparated) {
            // Separate Dimensions mode
            var xProp = layer.property("ADBE Transform Group").property("ADBE Position_0");
            var yProp = layer.property("ADBE Transform Group").property("ADBE Position_1");
            
            if (xProp) xProp.setValue(0);
            if (yProp) yProp.setValue(0);
            
            // Only set Z if layer is 3D (Z Position only exists for 3D layers)
            if (layer.threeDLayer) {
                var zProp = layer.property("ADBE Transform Group").property("ADBE Position_2");
                if (zProp) zProp.setValue(0);
            }
        } else {
            // Normal unified position property
            // Check if layer is 3D
            if (layer.threeDLayer) {
                // 3D layer - set all three axes to 0
                posProp.setValue([0, 0, 0]);
            } else {
                // 2D layer - only X and Y
                posProp.setValue([0, 0]);
            }
        }
    } catch (e) {
        alert("Error: " + e.toString());
    }

    app.endUndoGroup();
})();