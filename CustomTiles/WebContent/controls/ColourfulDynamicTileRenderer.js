// Copyright (c) 2009-2014 SAP SE, All Rights Reserved
/*global jQuery, sap*/

(function () {
    "use strict";
    jQuery.sap.declare("controls.ColourfulDynamicTileRenderer");
    jQuery.sap.require("sap.ushell.ui.tile.TileBaseRenderer");
    jQuery.sap.require("sap.ushell.ui.tile.State");
    jQuery.sap.require("sap.ui.core.format.NumberFormat");

    /**
     * @name sap.ushell.ui.tile.DynamicTileRenderer.
     * @static
     * @private
     */
    controls.ColourfulDynamicTileRenderer = sap.ui.core.Renderer.extend(sap.ushell.ui.tile.TileBaseRenderer);
    var translationBundle = sap.ushell.resources.i18n;

    /**
     * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
     *
     * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
     * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
     */
    controls.ColourfulDynamicTileRenderer.renderPart = function (oRm, oControl) {
        // write the HTML into the render manager
        oRm.write("<div");
        oRm.addClass("sapUshellDynamicTile");
        oRm.writeClasses();
        oRm.write(">");

        // dynamic data
        oRm.write("<div");
        oRm.addClass("sapUshellDynamicTileData");
        oRm.addClass((oControl.getNumberState() ? "sapUshellDynamicTileData" + oControl.getNumberState() :
                                                  "sapUshellDynamicTileData" + sap.ushell.ui.tile.State.Neutral));
        oRm.writeClasses();
        oRm.write(">");

        //sapUshellDynamicTileIndication that includes Arrow and number factor
        oRm.write("<div class='sapUshellDynamicTileIndication'>");

        // state arrow

            if (oControl.getStateArrow()) {
                oRm.write("<div");
                oRm.addClass("sapUshellDynamicTileStateArrow");
                oRm.addClass("sapUshellDynamicTileData" + oControl.getStateArrow());
                oRm.writeClasses();
                oRm.write(">");
                oRm.write("</div>");
            }

            // unit
        oRm.write('<br><div'); //br was added in order to solve the issue of all the combination of presentation options between Number - Arrow - Unit
        oRm.addClass("sapUshellDynamicTileNumberFactor");
        oRm.writeClasses();
        oRm.writeAccessibilityState(oControl, {label : translationBundle.getText("TileUnits_lable") + oControl.getNumberFactor()});
        oRm.write('>');
        oRm.writeEscaped(oControl.getNumberFactor());
        oRm.write('</div>');

        // closeing the sapUshellDynamicTileIndication scope
        oRm.write("</div>");
        //}

        // number
        var numValue = oControl.getNumberValue(),
            number;

        if (typeof numValue === "string" && isNaN(parseFloat(numValue))) {
            number = numValue;
        } else {
            var oNForm = sap.ui.core.format.NumberFormat.getFloatInstance({maxFractionDigits: oControl.getNumberDigits()});
            number = oNForm.format(oControl.getNumberValue());
        }

        oRm.write('<div');
        oRm.addClass("sapUshellDynamicTileNumber");
        oRm.writeClasses();
        if (number && number !== "") {
            oRm.writeAccessibilityState(oControl, {
                label : translationBundle.getText("TileValue_lable") + number
            });
            oRm.write('>');
            var displayNumber = number;
            //we have to crop numbers to prevent overflow
            try {
                //max characters without icon is 5, with icon 4
                var maxCharactersInDisplayNumber = oControl.getIcon() ? 4 : 5;
                //if last character is '.', we need to crop it also
                maxCharactersInDisplayNumber -= (number[maxCharactersInDisplayNumber-1] == '.') ? 1 : 0;
                var displayNumber = displayNumber.substring(0, maxCharactersInDisplayNumber);
            } catch (e) {
            }
            oRm.writeEscaped(displayNumber);
        } else {
            // in case numberValue is a String
            oRm.write('>');
            oRm.writeEscaped(oControl.getNumberValue());
        }
        oRm.write('</div>');

        // end of dynamic data
        oRm.write("</div>");

        // span element
        oRm.write("</div>");
    };

    

    
    controls.ColourfulDynamicTileRenderer.getInfoPrefix = function (oControl) {
        return oControl.getNumberUnit();
    };
    
    
    controls.ColourfulDynamicTileRenderer.render = function (oRm, oControl) {
        // is it necessary to wrap the control into a link?
        var sTileTitleTooltip = translationBundle.getText('launchTileTitle_tooltip', [oControl.getTitle()]),
            sInfoPrefix,
            oIcon;
        oRm.write("<div");
        oRm.writeControlData(oControl);
        if(oControl.getTargetURL()){
            oRm.writeAttributeEscaped("data-targeturl", oControl.getTargetURL());
        }
        oRm.writeAttributeEscaped("tabindex", "0");
        oRm.addClass("sapUshellTileBase");
        oRm.writeClasses();
        oRm.write(" style=\" background-color: "+ oControl.getBgColour() +"; opacity: 1.0 ; border-color: "+ oControl.getBgColour() +";\"");
        oRm.write(">");

        // plain title + subtitle wrapper
        oRm.write("<div");
        oRm.addClass("sapUshellTileBaseHeader");
        oRm.writeClasses();
        oRm.write(">");

        // title
        oRm.write("<h3");
        oRm.addClass("sapUshellTileBaseTitle");
        oRm.writeClasses();
        oRm.writeAttributeEscaped('title', sTileTitleTooltip);
        oRm.writeAccessibilityState(oControl, {label : translationBundle.getText("TileTitle_lable") + oControl.getTitle()});
        oRm.write(" style=\" color: "+ oControl.getTitleFontColour() +";\"");
        
        oRm.write(">");
        // note: this mustn't be escaped, as highlight already does that
        oRm.write(this.highlight(oControl.getHighlightTerms(), oControl.getTitle() || ""));
        oRm.write("</h3>");

        // subtitle
        if (oControl.getSubtitle()) {
            oRm.write("<h4");
            oRm.addClass("sapUshellTileBaseSubtitle");
            oRm.writeClasses();
            oRm.writeAccessibilityState(oControl, {label : translationBundle.getText("TileSubTitle_lable") + oControl.getSubtitle()});
            oRm.write(" style=\" color: "+ oControl.getSubTitleFontColour() +";\"");
            oRm.write(">");
            // note: this mustn't be escaped, as highlight already does that
            oRm.write(this.highlight(oControl.getHighlightTerms(), oControl.getSubtitle()));
            oRm.write("</h4>");
        }

        oRm.write("</div>");

        /* render inheriting controls  */
        if (typeof (this.renderPart) === 'function') {
            this.renderPart(oRm, oControl);
        }

        // icon
        if (oControl.getIcon()) {
            oIcon = new sap.ui.core.Icon({src: oControl.getIcon()});
            oIcon.addStyleClass("sapUshellTileBaseIcon");
            if (oControl.getIconColour()) {
            	oIcon.setColor(oControl.getIconColour());
            }
           // oIcon.addStyleClass
            oRm.renderControl(oIcon);
        }

        // begin sapUshellTileBaseInfo
        if (oControl.getInfo() || ((typeof (this.getInfoPrefix) === 'function')) && this.getInfoPrefix(oControl)) {
            oRm.write("<div");
            oRm.addClass("sapUshellTileBaseInfo");
            oRm.addClass(oControl.getInfoState() ? "sapUshellTileBase" + oControl.getInfoState() : "sapUshellTileBase" + sap.ushell.ui.tile.State.Neutral);
            oRm.writeClasses();
            oRm.writeAccessibilityState(oControl, {label : translationBundle.getText("TileInfo_lable") + oControl.getInfo()});
            oRm.write(">");

            // it is possible for subclasses to prefix the info with arbitrary information (e.g. unit ex DynamicTiles)
            if (typeof (this.getInfoPrefix) === 'function') {
                sInfoPrefix = this.getInfoPrefix(oControl);
                oRm.writeEscaped(sInfoPrefix);
            }
            // info string
            if (oControl.getInfo()) {
                // number units are separated from info text with a comma
                if (sInfoPrefix) {
                    oRm.write(", ");
                }
                // note: this mustn't be escaped, as highlight already does that
                oRm.write(this.highlight(oControl.getHighlightTerms(), oControl.getInfo()));
            }
            // end sapUshellTileBaseInfo
            oRm.write("</div>");

        }

        // end control div element
        oRm.write("</div>");
    };
    
    
    
    
}());