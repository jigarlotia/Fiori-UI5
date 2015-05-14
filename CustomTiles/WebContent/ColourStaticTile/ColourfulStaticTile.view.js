
sap.ui.jsview("ColourStaticTile.ColourfulStaticTile", {

	/** Specifies the Controller belonging to this View. 
	* In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
	* @memberOf ColourfulStaticTile
	*/ 
	getControllerName : function() {
		return "ColourStaticTile.ColourfulStaticTile";
	},

	/** Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed. 
	* Since the Controller is given to this method, its event handlers can be attached right away. 
	* @memberOf ColourfulStaticTile
	*/ 
	createContent : function(oController) {
		jQuery.sap.registerModulePath('controls', '/sap/bc/ui5_ui5/sap/zcustomtiles/controls');
		jQuery.sap.require('controls.RoundedTile');
		jQuery.sap.require('sap.ushell.ui.tile.StaticTile');

        return new controls.RoundedTile(
            {
                title: "{/config/display_title_text}",
                subtitle: "{/config/display_subtitle_text}",
                info: "{/config/display_info_text}",
                infoState: "Neutral",
                icon: "{/config/display_icon_url}",
                targetURL: "{/nav/navigation_target_url}",
                highlightTerms: "{/search/display_highlight_terms}",
               // bgColor : "rgb(57, 123, 110)",
                press: [ oController.onPress, oController ]
            }
        );
	}

});