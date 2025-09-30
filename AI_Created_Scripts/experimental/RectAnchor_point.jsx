{
    function setRectangleAnchorExpression() {
        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        if (comp.selectedLayers.length !== 1) {
            alert("Please select exactly one shape layer.");
            return;
        }

        var layer = comp.selectedLayers[0];

        if (!(layer instanceof ShapeLayer)) {
            alert("Selected layer must be a shape layer.");
            return;
        }

        // ---- POPUP DIALOG ----
        var win = new Window("dialog", "Choose Anchor Point");
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];

        var dropdown = win.add("dropdownlist", undefined, [
            "Center",
            "Top Left",
            "Top Right",
            "Bottom Left",
            "Bottom Right"
        ]);
        dropdown.selection = 0;

        var btnGroup = win.add("group");
        btnGroup.alignment = "center";
        var okBtn = btnGroup.add("button", undefined, "OK");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");

        var userChoice = null;
        okBtn.onClick = function () {
            userChoice = dropdown.selection.text;
            win.close();
        };
        cancelBtn.onClick = function () {
            win.close();
        };

        win.center();
        win.show();

        if (userChoice === null) return; // cancelled

        app.beginUndoGroup("Set Rectangle Anchor Expression");

        try {
            var selectedProps = layer.selectedProperties;
            if (selectedProps.length === 0) {
                alert("Please select the Rectangle Path property inside the shape layer.");
                app.endUndoGroup();
                return;
            }

            var rectPath = null;
            for (var i = 0; i < selectedProps.length; i++) {
                if (selectedProps[i].matchName === "ADBE Vector Shape - Rect") {
                    rectPath = selectedProps[i];
                    break;
                }
            }

            if (!rectPath) {
                alert("No Rectangle Path selected. Please select the rectangle path inside the shape layer.");
                app.endUndoGroup();
                return;
            }

            var posProp = rectPath.property("ADBE Vector Rect Position");

            var anchorChoice = userChoice.toLowerCase().replace(" ", "");

            // AE Expression: dynamic, keeps the anchor fixed while size changes
            var expr =
                "s = thisProperty.propertyGroup(1).size;\n" +
                "halfW = s[0]/2;\n" +
                "halfH = s[1]/2;\n" +
                "switch ('" + anchorChoice + "') {\n" +
                "  case 'center': [0,0]; break;\n" +
                "  case 'topleft': [halfW,halfH]; break;\n" +
                "  case 'topright': [halfW,halfH]; break;\n" +
                "  case 'bottomleft': [-halfW,-halfH]; break;\n" +
                "  case 'bottomright': [-halfW,-halfH]; break;\n" +
                "  default: [0,0];\n" +
                "}";

            posProp.expression = expr;

        } catch (err) {
            alert("Error: " + err.toString());
        }

        app.endUndoGroup();
    }

    setRectangleAnchorExpression();
}
