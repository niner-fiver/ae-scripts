/*
===========================================================
Text Layer Name to Source - Version 1.0
Author: ChatGPT and Josh Spivey (OpenAI)
Date: 2025-08-14

Description:
Takes all selected text layers and renames their layers to match the source
text
 
 - Truncates to 30 characters and adds an ellipse...
 - Eliminates the need to hit "Enter, Delete, Enter" on each individual layer

Change Log:
v1.0 (2025-08-14)
 - 

===========================================================
*/



{
    function renameTextLayersToSource() {
        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        if (comp.selectedLayers.length === 0) {
            alert("Please select at least one text layer.");
            return;
        }

        app.beginUndoGroup("Rename Text Layers to Source Text");

        var selectedLayers = comp.selectedLayers;

        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];

            // Check if layer is a text layer
            if (layer instanceof TextLayer) {
                try {
                    var textProp = layer.property("Source Text");
                    if (textProp != null) {
                        var textValue = textProp.value.text;

                        if (textValue !== "") {
                            var newName = textValue;

                            // Truncate if longer than 30 chars
                            if (newName.length > 30) {
                                newName = newName.substring(0, 30) + "…";
                            }

                            layer.name = newName;
                        }
                    }
                } catch (err) {
                    // Skip this layer if any error occurs
                }
            }
        }

        app.endUndoGroup();
    }

    renameTextLayersToSource();
}
