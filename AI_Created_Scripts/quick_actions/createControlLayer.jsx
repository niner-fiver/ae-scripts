// After Effects Script: Dockable UI for Control Layer Creation
// Save as: controlLayerUI.jsx

(function thisScript(thisObj) {

    function buildUI(thisObj) {
        var pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Control Layer Creator", undefined, {resizeable:true});
        
        var btn = pal.add("button", undefined, "Create Control Layer");

        btn.onClick = function () {
            app.beginUndoGroup("Create Control Layer");

            var comp = app.project.activeItem;
            if (!(comp && comp instanceof CompItem)) {
                alert("Please select or open a composition first.");
                return;
            }

            // Create Shape Layer
            var ctrlLayer = comp.layers.addShape();
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
                ctrlLayer.Effects.addProperty("ADBE Dropdown Control").name = "Dropdown " + i;
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