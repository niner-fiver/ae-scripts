/*
===========================================================
Control Layer Creator - Version 1.0
Author: ChatGPT (OpenAI)
Date: 2025-08-14

Description:
Creates a dockable UI in After Effects that allows you to:
- Choose between creating a Shape Layer or Null Layer as a control layer
- Set that layer's opacity to 0%
- Enter numbers for how many Slider, Checkbox, and Dropdown controls to add
- Dropdown controls are automatically pre-filled with "Option 1", "Option 2", "Option 3"

Change Log:
v1.0 (2025-08-14)
 - Initial release with Shape/Null selection
 - Adds slider, checkbox, and dropdown controls
 - Dropdowns auto-populated with default options

===========================================================
*/

(function thisScript(thisObj) {

    function buildUI(thisObj) {
        var pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Control Layer Creator", undefined, {resizeable:true});
        
        // Layer type selection
        pal.add("statictext", undefined, "Control Layer Type:");
        var layerTypeDropdown = pal.add("dropdownlist", undefined, ["Shape Layer", "Null Layer"]);
        layerTypeDropdown.selection = 0; // Default to Shape Layer
        
        pal.add("panel", undefined, undefined).preferredSize = [200, 2]; // Separator
        
        var btn = pal.add("button", undefined, "Create Control Layer");

        btn.onClick = function () {
            app.beginUndoGroup("Create Control Layer");

            var comp = app.project.activeItem;
            if (!(comp && comp instanceof CompItem)) {
                alert("Please select or open a composition first.");
                return;
            }

            var ctrlLayer;
            var selectedType = layerTypeDropdown.selection.text;

            if (selectedType === "Shape Layer") {
                ctrlLayer = comp.layers.addShape();
            } else if (selectedType === "Null Layer") {
                ctrlLayer = comp.layers.addNull();
            }

            ctrlLayer.name = "Control Layer";
            ctrlLayer.property("Transform").property("Opacity").setValue(0);

            app.endUndoGroup();

            // Show second UI for number inputs
            showControlsDialog(ctrlLayer);
        };

        pal.layout.layout(true);
        return pal;
    }

    function showControlsDialog(ctrlLayer) {
        var dlg = new Window("dialog", "Add Controls");

        dlg.add("statictext", undefined, "Number of Slider Controls:");
        var sliderCount = dlg.add("edittext", undefined, "0");
        sliderCount.characters = 5;

        dlg.add("statictext", undefined, "Number of Checkbox Controls:");
        var checkboxCount = dlg.add("edittext", undefined, "0");
        checkboxCount.characters = 5;

        dlg.add("statictext", undefined, "Number of Dropdown Controls:");
        var dropdownCount = dlg.add("edittext", undefined, "0");
        dropdownCount.characters = 5;

        var btnGroup = dlg.add("group");
        btnGroup.add("button", undefined, "OK");
        btnGroup.add("button", undefined, "Cancel");

        if (dlg.show() == 1) {
            app.beginUndoGroup("Add Controls");

            var sliders = parseInt(sliderCount.text, 10) || 0;
            var checks = parseInt(checkboxCount.text, 10) || 0;
            var drops = parseInt(dropdownCount.text, 10) || 0;

            for (var i = 1; i <= sliders; i++) {
                ctrlLayer.Effects.addProperty("ADBE Slider Control").name = "Slider " + i;
            }
            for (var i = 1; i <= checks; i++) {
                ctrlLayer.Effects.addProperty("ADBE Checkbox Control").name = "Checkbox " + i;
            }
            for (var i = 1; i <= drops; i++) {
                var dd = ctrlLayer.Effects.addProperty("ADBE Dropdown Control");
                dd.name = "Dropdown " + i;

                // Add default dropdown items
                var menu = dd.property(1); // "Menu" property
                if (menu && menu.isEnumeration) {
                    menu.setPropertyParameters({
                        items: ["Option 1", "Option 2", "Option 3"]
                    });
                }
            }

            app.endUndoGroup();
        }
    }

    var myUI = buildUI(thisObj);
    if (myUI instanceof Window) {
        myUI.center();
        myUI.show();
    }

})(this);
