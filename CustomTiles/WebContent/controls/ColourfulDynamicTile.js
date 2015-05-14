/**
 * @author Jigar Lotia
 */

jQuery.sap.declare("controls.CoulourfulDynamicTile");
//jQuery.sap.includeStyleSheet("/sap/bc/ui5_ui5/sap/zcustomtiles/controls/roundedTile.css");
//jQuery.sap.require("sap.m.StandardTile");
jQuery.sap.require('sap.ushell.ui.tile.DynamicTile');
sap.ushell.ui.tile.DynamicTile.extend("controls.ColourfulDynamicTile", {
	metadata : {
		properties : {
			// Icon color property with default value to standard UI5 blue
			iconColor : {
				type : "string",
				defaultValue : "#007cc0"
			},
			// Background color property with default value to white
			bgColour : {
				type : "string",
				//defaultValue : "rgb(100, 100, 100)"
			},
			// Border color property with default value to standard UI5 blue
			borderColor : {
				type : "string",
				defaultValue : "#007cc0"
			}
		}
	}
});
