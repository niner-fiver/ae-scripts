// Align Selected Keyframes to Playhead Script
// This script moves all selected keyframes to the current playhead position
// while preserving their values and easing properties

(function alignSelectedKeyframesToPlayhead() {
    
    // Check if we have an active composition
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Please select a composition first.");
        return;
    }
    
    // Get current playhead time
    var currentTime = comp.time;
   // alert("Current playhead time: " + currentTime.toFixed(3) + " seconds");
    
    // Begin undo group
    app.beginUndoGroup("Align Selected Keyframes to Playhead");
    
    var allSelectedKeyframes = [];
    
    try {
        // FIRST PASS: Collect all selected keyframes before making any changes
        // alert("Phase 1: Collecting all selected keyframes...");
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            collectSelectedKeyframes(layer, allSelectedKeyframes, layer.name);
        }
        
       // alert("Found " + allSelectedKeyframes.length + " selected keyframes total");
        
        if (allSelectedKeyframes.length === 0) {
            alert("No selected keyframes found.\n\nTip: Select keyframes by clicking on them in the timeline while holding Shift for multiple selections.");
            return;
        }
        
        // Show what we found
        var summaryText = "Selected keyframes found:\n";
        for (var i = 0; i < allSelectedKeyframes.length; i++) {
            var keyInfo = allSelectedKeyframes[i];
            summaryText += (i + 1) + ". " + keyInfo.layerName + " > " + keyInfo.propertyPath + "\n";
        }
       // alert(summaryText);
        
        // SECOND PASS: Process all collected keyframes
       // alert("Phase 2: Moving keyframes to playhead...");
        var processedCount = 0;
        
        for (var i = 0; i < allSelectedKeyframes.length; i++) {
            var keyInfo = allSelectedKeyframes[i];
            if (moveKeyframeToTime(keyInfo, currentTime)) {
                processedCount++;
            }
        }
        
        // Final summary
        /* alert("Success!\n" + 
              "Moved " + processedCount + " keyframes to time " + currentTime.toFixed(3) + " seconds"); */
        
    } catch (error) {
        alert("Error occurred: " + error.toString());
    } finally {
        app.endUndoGroup();
    }
}());

// Function to collect all selected keyframes without modifying anything
function collectSelectedKeyframes(propertyGroup, keyframeArray, layerName) {
    try {
        for (var i = 1; i <= propertyGroup.numProperties; i++) {
            var prop = propertyGroup.property(i);
            
            if (prop.propertyType === PropertyType.PROPERTY) {
                // This is an actual property with potential keyframes
                if (prop.numKeys > 0) {
                    var selectedKeys = prop.selectedKeys;
                    
                    if (selectedKeys.length > 0) {
                        var propPath = getPropertyPath(prop);
                        
                        // Store info for each selected keyframe
                        for (var j = 0; j < selectedKeys.length; j++) {
                            var keyIndex = selectedKeys[j];
                            
                            var keyframeInfo = {
                                property: prop,
                                layerName: layerName,
                                propertyPath: propPath,
                                originalIndex: keyIndex,
                                originalTime: prop.keyTime(keyIndex),
                                value: prop.keyValue(keyIndex),
                                inInterpolationType: prop.keyInInterpolationType(keyIndex),
                                outInterpolationType: prop.keyOutInterpolationType(keyIndex)
                            };
                            
                            // Debug interpolation types
                            var inType = getInterpolationTypeName(keyframeInfo.inInterpolationType);
                            var outType = getInterpolationTypeName(keyframeInfo.outInterpolationType);
                           // alert("Keyframe " + (j+1) + " on " + propPath + ":\nIn: " + inType + ", Out: " + outType);
                            
                            // Store temporal easing if available
                            try {
                                keyframeInfo.inTemporalEase = prop.keyInTemporalEase(keyIndex);
                                keyframeInfo.outTemporalEase = prop.keyOutTemporalEase(keyIndex);
                                
                                // Debug temporal easing
                                var inEase = keyframeInfo.inTemporalEase;
                                var outEase = keyframeInfo.outTemporalEase;
                               // alert("Temporal Easing - In: [" + inEase[0].speed + "," + inEase[0].influence + "] Out: [" + outEase[0].speed + "," + outEase[0].influence + "]");
                                
                            } catch (e) {
                                alert("No temporal easing available for this property type");
                            }
                            
                            // Store spatial properties if available
                            try {
                                keyframeInfo.inSpatialTangent = prop.keyInSpatialTangent(keyIndex);
                                keyframeInfo.outSpatialTangent = prop.keyOutSpatialTangent(keyIndex);
                                keyframeInfo.spatialAutoBezier = prop.keySpatialAutoBezier(keyIndex);
                                keyframeInfo.spatialContinuous = prop.keySpatialContinuous(keyIndex);
                            } catch (e) {
                                // Property doesn't support spatial properties
                            }
                            
                            keyframeArray.push(keyframeInfo);
                        }
                    }
                }
            } else if (prop.numProperties > 0) {
                // This is a property group, recurse into it
                collectSelectedKeyframes(prop, keyframeArray, layerName);
            }
        }
    } catch (error) {
        // alert("Error collecting keyframes from " + layerName + ": " + error.toString());
    }
}

// Function to move a single keyframe to the target time
function moveKeyframeToTime(keyframeInfo, targetTime) {
    try {
        var prop = keyframeInfo.property;
        var originalIndex = keyframeInfo.originalIndex;
        
        // Find the current index of this keyframe (it might have shifted due to other operations)
        var currentIndex = findKeyframeByTimeAndValue(prop, keyframeInfo.originalTime, keyframeInfo.value);
        
        if (currentIndex === 0) {
            alert("Warning: Could not find keyframe for " + keyframeInfo.layerName + " > " + keyframeInfo.propertyPath);
            return false;
        }
        
        // Remove the original keyframe
        prop.removeKey(currentIndex);
        
        // Add keyframe at target time
        prop.setValueAtTime(targetTime, keyframeInfo.value);
        
        // Find the new keyframe index
        var newKeyIndex = findKeyframeAtTime(prop, targetTime);
        
        if (newKeyIndex > 0) {
            // Debug what we're about to restore
            var inType = getInterpolationTypeName(keyframeInfo.inInterpolationType);
            var outType = getInterpolationTypeName(keyframeInfo.outInterpolationType);
           // alert("Restoring interpolation for " + keyframeInfo.propertyPath + ":\nIn: " + inType + ", Out: " + outType);
            
            // Restore interpolation types FIRST
            prop.setInterpolationTypeAtKey(newKeyIndex, keyframeInfo.inInterpolationType, keyframeInfo.outInterpolationType);
            
            // Restore temporal easing if available (ONLY for BEZIER interpolation)
            if (keyframeInfo.inTemporalEase && keyframeInfo.outTemporalEase) {
                try {
                    // Only apply temporal easing for bezier keyframes
                    if (keyframeInfo.inInterpolationType === KeyframeInterpolationType.BEZIER || 
                        keyframeInfo.outInterpolationType === KeyframeInterpolationType.BEZIER) {
                        prop.setTemporalEaseAtKey(newKeyIndex, keyframeInfo.inTemporalEase, keyframeInfo.outTemporalEase);
                       // alert("Applied temporal easing to bezier keyframe");
                    } else {
                       // alert("Skipped temporal easing for linear keyframe");
                    }
                } catch (e) {
                    // alert("Error applying temporal easing: " + e.toString());
                }
            }
            
            // Restore spatial properties if available
            if (keyframeInfo.inSpatialTangent && keyframeInfo.outSpatialTangent) {
                try {
                    prop.setSpatialTangentsAtKey(newKeyIndex, keyframeInfo.inSpatialTangent, keyframeInfo.outSpatialTangent);
                    prop.setSpatialAutoBezierAtKey(newKeyIndex, keyframeInfo.spatialAutoBezier);
                    prop.setSpatialContinuousAtKey(newKeyIndex, keyframeInfo.spatialContinuous);
                } catch (e) {
                    // Spatial properties couldn't be applied
                }
            }
        }
        
        return true;
        
    } catch (error) {
        alert("Error moving keyframe for " + keyframeInfo.layerName + " > " + keyframeInfo.propertyPath + ": " + error.toString());
        return false;
    }
}

// Helper function to find keyframe by time and value (more robust than just time)
function findKeyframeByTimeAndValue(prop, time, value) {
    for (var i = 1; i <= prop.numKeys; i++) {
        if (Math.abs(prop.keyTime(i) - time) < 0.001) {
            // Time matches, now check if value matches (for multi-dimensional properties)
            var keyValue = prop.keyValue(i);
            
            if (valuesMatch(keyValue, value)) {
                return i;
            }
        }
    }
    return 0;
}

// Helper function to compare values (handles both single values and arrays)
function valuesMatch(val1, val2) {
    if (val1 instanceof Array && val2 instanceof Array) {
        if (val1.length !== val2.length) return false;
        for (var i = 0; i < val1.length; i++) {
            if (Math.abs(val1[i] - val2[i]) > 0.001) return false;
        }
        return true;
    } else {
        return Math.abs(val1 - val2) < 0.001;
    }
}

// Helper function to find keyframe index at specific time
function findKeyframeAtTime(prop, time) {
    for (var i = 1; i <= prop.numKeys; i++) {
        if (Math.abs(prop.keyTime(i) - time) < 0.001) {
            return i;
        }
    }
    return 0;
}

// Helper function to get full property path
function getPropertyPath(prop) {
    var path = prop.name;
    var currentProp = prop.parentProperty;
    
    while (currentProp && currentProp.name) {
        path = currentProp.name + " > " + path;
        currentProp = currentProp.parentProperty;
    }
    
    return path;
}

// Helper function to get readable interpolation type name
function getInterpolationTypeName(interpolationType) {
    switch (interpolationType) {
        case KeyframeInterpolationType.LINEAR:
            return "LINEAR";
        case KeyframeInterpolationType.BEZIER:
            return "BEZIER";
        case KeyframeInterpolationType.HOLD:
            return "HOLD";
        default:
            return "UNKNOWN (" + interpolationType + ")";
    }
}