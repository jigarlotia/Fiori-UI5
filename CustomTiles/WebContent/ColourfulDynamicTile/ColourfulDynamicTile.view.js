sap.ui.jsview("ColourfulDynamicTile.ColourfulDynamicTile", {

	/** Specifies the Controller belonging to this View. 
	* In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
	* @memberOf ColourfulDynamicTile.ColourfulDynamicTile
	*/ 
	getControllerName : function() {
		return "ColourfulDynamicTile.ColourfulDynamicTile";
	},

	/** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed. 
	* Since the Controller is given to this method, its event handlers can be attached right away. 
	* @memberOf ColourfulDynamicTile.ColourfulDynamicTile
	*/ 
	createContent : function(oController) {
    	jQuery.sap.require('sap.ushell.ui.tile.DynamicTile');
//    	var sPath = jQuery.sap.getModulePath("ColourfulDynamicTile");
    	jQuery.sap.registerModulePath('controls', '/sap/bc/ui5_ui5/sap/zcustomtiles/controls');
    	//jQuery.sap.registerModulePath('controls', './controls');
		//jquery.sap.registerModulePath("utils")
		jQuery.sap.require('controls.ColourfulDynamicTile');
//		jQuery.sap.require('sap.ushell.ui.tile.StaticTile');

        this.setHeight('100%');
        this.setWidth('100%');
        
        var oColourfulDyanmicTile =  new controls.ColourfulDynamicTile(
            {
                title: "{/data/display_title_text}",
                subtitle: "{/data/display_subtitle_text}",
                info: "{/data/display_info_text}",
                infoState: "{/data/display_info_state}",
                icon: "{/data/display_icon_url}",
                numberUnit: "{/data/display_number_unit}",
                numberValue: "{/data/display_number_value}",
                numberDigits: "{/data/display_number_digits}",
                numberState: "{/data/display_number_state}",
                numberFactor: "{/data/display_number_factor}",
                stateArrow: "{/data/display_state_arrow}",
                targetURL: "{/nav/navigation_target_url}",
                highlightTerms: "{/search/display_highlight_terms}",
                bgColour: "{/data/bgColour}",
                press : [ oController.onPress, oController ]
            }
        );
        return oColourfulDyanmicTile;
    }
});
	