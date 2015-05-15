/**
 * 
 */
this.sap = this.sap || {};
(function () {
    "use strict";
    /*global document, jQuery, sap, OData */

    jQuery.sap.declare("utils.utils");
    jQuery.sap.require("sap.ushell.components.tiles.utils");
    sap.ushell.components.tiles.utils = sap.ushell.components.tiles.utils || {};
    utils.utils = utils.utils || {};
    if (utils.utils.getConfiguration) {
        return;
    }
    utils.utils.getConfiguration = function (oTileApi, bAdmin, bEdit) {

        var oResourceBundle,
            sConfig = oTileApi.configuration.getParameterValueAsString('tileConfiguration'),
            oConfig = JSON.parse(sConfig || "{}"),

        //first try to get properties from bag
            sTitle = sap.ushell.components.tiles.utils.getTranslatedTitle(oTileApi),
            sSubtitle = sap.ushell.components.tiles.utils.getTranslatedSubtitle(oTileApi, oConfig),
            sInfo = sap.ushell.components.tiles.utils.getTranslatedProperty(oTileApi, oConfig, 'display_info_text'),
            sKeywords = sap.ushell.components.tiles.utils.getTranslatedProperty(oTileApi, oConfig, 'display_search_keywords');

        if (bAdmin) {
            // resource bundle is only used in admin mode
            oResourceBundle = sap.ushell.components.tiles.utils.getResourceBundleModel().getResourceBundle();

            if (bEdit && oTileApi.bag){
                var orgLocale = oTileApi.bag.getOriginalLanguage();
                var userLocale = sap.ui.getCore().getConfiguration().getLanguage();
                oConfig.isLocaleSuitable = orgLocale === "" || orgLocale.toLowerCase() === userLocale.toLowerCase();
                oConfig.orgLocale = orgLocale;
                oConfig.userLocale = userLocale;

            }
        }
        // in Admin UI, we display sample values for info/title/subtitle if not defined in the configuration
        oConfig.display_icon_url = oConfig.display_icon_url || "";
        oConfig.display_info_text = sInfo || oConfig.display_info_text ||
            (bAdmin && !bEdit ?
                    "[" + oResourceBundle.getText("configuration.display_info_text") + "]" :
                     "");
        oConfig.navigation_semantic_object = oConfig.navigation_semantic_object || "";
        oConfig.navigation_semantic_action = oConfig.navigation_semantic_action || "";
        oConfig.navigation_semantic_parameters = oConfig.navigation_semantic_parameters || "";
        oConfig.display_number_unit = oConfig.display_number_unit || "";
        oConfig.display_number_factor = oConfig.display_number_factor || "";
        oConfig.bgColour = oConfig.bgColour || "";
        oConfig.titleFontColour = oConfig.titleFontColour || "";
        oConfig.subTitleFontColour = oConfig.subTitleFontColour || "";
        oConfig.iconColour = oConfig.iconColour || "";
        oConfig.service_refresh_interval = oConfig.service_refresh_interval || 0;
        oConfig.service_url = oConfig.service_url || "";
        oConfig.navigation_target_url = oConfig.navigation_target_url || "";
        if (bAdmin && sap.ushell.components.tiles.utils.isInitial(sTitle)) {
            oConfig.display_title_text = bEdit ?
                    "" :
                    "[" + oResourceBundle.getText("configuration.display_title_text") + "]";
            oConfig.display_subtitle_text = bEdit ?
                    "" :
                    "[" + oResourceBundle.getText("configuration.display_subtitle_text") + "]";
        } else {
            oConfig.display_title_text = sTitle || oConfig.display_title_text || "";
            oConfig.display_subtitle_text = sSubtitle || oConfig.display_subtitle_text || "";
        }
        oConfig.navigation_use_semantic_object = (oConfig.navigation_use_semantic_object === false ? false : true);
        oConfig.display_search_keywords = sKeywords || oConfig.display_search_keywords || "";

        // display sample value '1234' in Admin UI
        if (bAdmin) {
            oConfig.display_number_value = oConfig.display_number_value || 1234;
        }

        //If form factors were not configured yet, use default values
        //oConfig.form_factors = oConfig.form_factors ? oConfig.form_factors : this.getDefaultFormFactors();
        oConfig.form_factors = oConfig.form_factors ? oConfig.form_factors : sap.ushell.components.tiles.utils.getDefaultFormFactors();

        
        oConfig.desktopChecked =  oConfig.form_factors.manual.desktop;
        oConfig.tabletChecked = oConfig.form_factors.manual.tablet;
        oConfig.phoneChecked = oConfig.form_factors.manual.phone;
        oConfig.manualFormFactor = !(oConfig.form_factors.appDefault);
        oConfig.appFormFactor = oConfig.form_factors.appDefault;

        //The following line is workaround for the case that the form factor parameters were set by default
        //We don't want to save this unless the user specifically changed the form factor (uncheck and immediately recheck is considered a change)
        oConfig.formFactorConfigDefault = oConfig.form_factors.defaultParam ? true : false;
        //oConfig.rows = (oConfig.mapping_signature && oConfig.mapping_signature !== "*=*") ? this.getMappingSignatureTableData(oConfig.mapping_signature) : [this.getEmptyRowObj()];
        oConfig.rows = (oConfig.mapping_signature && oConfig.mapping_signature !== "*=*") ? sap.ushell.components.tiles.utils.getMappingSignatureTableData(oConfig.mapping_signature) : [sap.ushell.components.tiles.utils.getEmptyRowObj()];
        //oConfig.isUnknownAllowed = (oConfig.mapping_signature !== undefined) ? this.getAllowUnknownParametersValue(oConfig.mapping_signature) : true;
        oConfig.isUnknownAllowed = (oConfig.mapping_signature !== undefined) ? sap.ushell.components.tiles.utils.getAllowUnknownParametersValue(oConfig.mapping_signature) : true;
        //sap.ushell.components.tiles.utils.

        //Tile Action table data

        if (bAdmin){
            //for designer
            //oConfig.tile_actions_rows = this.getTileNavigationActionsRows(oTileApi);
            oConfig.tile_actions_rows = sap.ushell.components.tiles.utils.getTileNavigationActionsRows(oTileApi);
        } else {
            //for runtime - if actions are already in the configuration we keep them (HANA), otherwise try to construct them from bag (on ABAP)
            if (!oConfig.actions){
                //oConfig.actions = this.getTileNavigationActions(oTileApi);

                oConfig.actions = sap.ushell.components.tiles.utils.getTileNavigationActions(oTileApi);
                
            }
        }

        return oConfig;
    };

    
    
    utils.utils.getDataToDisplay = function (oConfig, oDynamicData) {
        var nSum = 0,
            i,
            n,
            oCurrentNumber,
            sCurrentTargetParams,
            oData = {
                display_icon_url: oDynamicData.icon || oConfig.display_icon_url || "",
                display_title_text: oDynamicData.title || oConfig.display_title_text || "",
                display_number_value: oDynamicData.number || "...",
                display_number_unit: oDynamicData.numberUnit || oConfig.display_number_unit || "",
                display_info_text: oDynamicData.info || oConfig.display_info_text || "",
                display_info_state: oDynamicData.infoState || "Neutral",
                display_subtitle_text: oDynamicData.subtitle || oConfig.display_subtitle_text || "",
                display_state_arrow: oDynamicData.stateArrow || "None",
                display_number_state: oDynamicData.numberState || "Neutral",
                display_number_digits: oDynamicData.numberDigits || 0,
                display_number_factor: oDynamicData.numberFactor || "",
                display_search_keyword: oDynamicData.keywords || oConfig.display_search_keyword || "",
                bgColour: oDynamicData.bgColour || oConfig.bgColour || "",
                titleFontColour: oDynamicData.titleFontColour || oConfig.titleFontColour || "",
                subTitleFontColour: oDynamicData.subTitleFontColour || oConfig.subTitleFontColour || "",
                iconColour: oDynamicData.iconColour || oConfig.iconColour || "",

                targetParams: []
            };
        if (oDynamicData.infoStatus) {
            // wave 1 compatability with "infoStatus" field
            oData.display_info_state = oDynamicData.infoStatus;
        }
        if (oDynamicData.targetParams) {
            oData.targetParams.push(oDynamicData.targetParams);
        }
        // accumulate results field
        if (oDynamicData.results) {
            for (i = 0, n = oDynamicData.results.length; i < n; i = i + 1) {
                oCurrentNumber = oDynamicData.results[i].number || 0;
                if (typeof oCurrentNumber === "string") {
                    oCurrentNumber = parseInt(oCurrentNumber, 10);
                }
                nSum = nSum + oCurrentNumber;
                sCurrentTargetParams = oDynamicData.results[i].targetParams;
                if (sCurrentTargetParams) {
                    oData.targetParams.push(sCurrentTargetParams);
                }
            }
            oData.display_number_value = nSum;
        }
        return oData;
    };
    
    
    utils.utils.getConfigurationUi = function (oView, sViewName) {
        var oViewData = oView.getViewData(),
            oTileApi = oViewData.chip,
            oConfigurationView,
            oSemanticObjectSelector,
            oApplicationType;

        var oCurrentConfig = utils.utils.getConfiguration(oTileApi, true, true);

        //verify user allow to edit (user locale = original Locate

        var oConfigurationModel = new sap.ui.model.json.JSONModel({
            config : oCurrentConfig,
            // keep reference to the model in this model
            // (to be able to update it directly on configuration changes)
            tileModel : oView.getModel()
        });

        oConfigurationView = new sap.ui.view({
            type : sap.ui.core.mvc.ViewType.XML,
            viewData : oViewData,
            viewName : sViewName
        });

        oConfigurationView.setModel(oConfigurationModel);

        // initialize state of input fields depending on navigation_use_semantic_object
        // navigation_semantic_objectInput</code> used in static and dynamic tiles
        // semantic_objectInput used in action tile
        oSemanticObjectSelector = oConfigurationView.byId("navigation_semantic_objectInput") || oConfigurationView.byId("semantic_objectInput");
        if (oSemanticObjectSelector) {
            oSemanticObjectSelector.getModel().setProperty("/enabled", oCurrentConfig.navigation_use_semantic_object);
            oSemanticObjectSelector.getModel().setProperty("/value", oCurrentConfig.semantic_object || oCurrentConfig.navigation_semantic_object);
        }
        //Enable Application type radio button LPD_CUST/SAPUI5 depending on navigation_provider
        //Application type is used in action tile configuration
        //If navigation_provider value is 'LPD', then LPD_CUST radio button has to be selected.
        oApplicationType = oConfigurationView.byId("typeLpd_cust");
        if(oApplicationType){
            if(oView.getModel().getProperty('/config/navigation_provider')=="LPD" || oView.getModel().getProperty('/config/navigation_provider')=='') {
                oConfigurationView.byId("typeLpd_cust").setSelected(true);
                oConfigurationView.byId("typeSapui5").setSelected(false);
                sap.ushell.components.tiles.utils.displayLpdCustApplicationTypeFields(oConfigurationView);
            }
            else if(oView.getModel().getProperty('/config/navigation_provider')=="SAPUI5") {
                oConfigurationView.byId("typeLpd_cust").setSelected(false);
                oConfigurationView.byId("typeSapui5").setSelected(true);
                sap.ushell.components.tiles.utils.displaySapui5ApplicationTypeFields(oConfigurationView);
            }
        }
        return oConfigurationView;
    };

    
}());