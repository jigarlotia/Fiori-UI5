// Copyright (c) 2009-2014 SAP SE, All Rights Reserved
(function () {
    "use strict";
    /*global jQuery, OData, sap, setTimeout, Tiles */
    sap.ui.getCore().loadLibrary("sap.m");
    jQuery.sap.require("sap.ui.core.IconPool");
    jQuery.sap.require("sap.ui.thirdparty.datajs");
    jQuery.sap.require("sap.ushell.components.tiles.utils");
	jQuery.sap.registerModulePath('utils', '/sap/bc/ui5_ui5/sap/zcustomtiles/utils');

    jQuery.sap.require("utils.utils");
    sap.ui.controller("ColourfulDynamicTile.ColourfulDynamicTile", {
        // handle to control/cancel browser's setTimeout()
        timer : null,
        // handle to control/cancel data.js OData.read()
        oDataRequest : null,
        onInit : function () {
            var oView = this.getView(),
                oViewData = oView.getViewData(),
                oTileApi = oViewData.chip,
               //oConfig = sap.ushell.components.tiles.utils.getConfiguration(oTileApi, oTileApi.configurationUi.isEnabled(), false),
              oConfig = utils.utils.getConfiguration(oTileApi, oTileApi.configurationUi.isEnabled(), false),
                oModel,
                sKeywords,
                aKeywords,
                that = this,
                sNavigationTargetUrl = oConfig.navigation_target_url,
                sSystem;

            sSystem = oTileApi.url.getApplicationSystem();
            if (sSystem) { // propagate system to target application
                sNavigationTargetUrl += ((sNavigationTargetUrl.indexOf("?") < 0) ? "?" : "&")
                    + "sap-system=" + sSystem;
            }
            this.navigationTargetUrl = sNavigationTargetUrl;
            /*
             * Model of the applauncher tile consisting of
             *          config (tile configuration),
             *          data (dyanmic data read from a data source)
             *          nav (target URL set to '' in case of Admin UI), and
             *          search (highlight terms)
             */
            oModel = new sap.ui.model.json.JSONModel({
                config: oConfig,
                data: utils.utils.getDataToDisplay(oConfig, {
                    number: (oTileApi.configurationUi.isEnabled() ? 1234 : "...")
                }),
                nav: {navigation_target_url: (oTileApi.configurationUi && oTileApi.configurationUi.isEnabled() ? "" : sNavigationTargetUrl)},
                search: {
                    display_highlight_terms: []
                }
            });
            oView.setModel(oModel);

            // implement search contract
            if (oTileApi.search) {
                // split and clean keyword string (may be comma + space delimited)
                sKeywords = oView.getModel().getProperty("/config/display_search_keywords");
                aKeywords = jQuery.grep(sKeywords.split(/[, ]+/), function (n, i) { return n && n !== ""; });
                // defined in search contract:
                oTileApi.search.setKeywords(aKeywords);
                oTileApi.search.attachHighlight(
                    function (aHighlightWords) {
                        // update model for highlighted search term
                        oView.getModel().setProperty("/search/display_highlight_terms", aHighlightWords);
                    }
                );
            }

            // implement preview contract
            if (oTileApi.preview) {
                oTileApi.preview.setTargetUrl(sNavigationTargetUrl);
                oTileApi.preview.setPreviewIcon(oConfig.display_icon_url);
                oTileApi.preview.setPreviewTitle(oConfig.display_title_text);
            }

            // implement refresh contract
            if (oTileApi.refresh) {
                oTileApi.refresh.attachRefresh(this.refreshHandler.bind(null, this));
            }

            // attach the refresh handler also for the visible contract, as we would like
            // on setting visible to true, to directly go and call the oData call
            if (oTileApi.visible) {
                oTileApi.visible.attachVisible(this.visibleHandler.bind(this));
            }

            // implement configurationUi contract: setup configuration UI
            if (oTileApi.configurationUi.isEnabled()) {
                oTileApi.configurationUi.setUiProvider(function () {
                    // attach configuration UI provider, which is essentially a components.tiles.dynamicapplauncher.Configuration
                    var oConfigurationUi = sap.ushell.components.tiles.utils.getConfigurationUi(oView, "ColourfulDynamicTile.Configuration");
                    oTileApi.configurationUi.attachCancel(that.onCancelConfiguration.bind(null, oConfigurationUi));
                    oTileApi.configurationUi.attachSave(that.onSaveConfiguration.bind(null, oConfigurationUi));
                    return oConfigurationUi;
                });

                this.getView().getContent()[0].setTooltip(
                        sap.ushell.components.tiles.utils.getResourceBundleModel().getResourceBundle()
                        .getText("edit_configuration.tooltip")
                );
            } else {
                if (!oTileApi.preview || !oTileApi.preview.isEnabled()) {
                    if (!sSystem) {
                        sap.ushell.Container.addRemoteSystemForServiceUrl(oConfig.service_url);
                    } // else registration is skipped because registration has been done already
                      // outside this controller (e.g. remote catalog registration)

                    // start fetching data from backend service if not in preview or admin mode
                    this.onUpdateDynamicData();
                }
            }

            // attach the tile actions provider for the actions contract
            if (oTileApi.actions) {
                //TODO check new property name with designer dudes
                var aActions = oConfig.actions;
                if (aActions && aActions.length > 0){
                    oTileApi.actions.setActionsProvider(function (){
                        return aActions;
                    });
                }
            }

        },
        // convenience function to stop browser's timeout and OData calls
        stopRequests: function () {
            if (this.timer) {
                clearTimeout(this.timer);
            }
            if (this.oDataRequest) {
                try {
                    this.oDataRequest.abort();
                }catch (e){
                    jQuery.sap.log.warning(e.name,e.message);
                }
            }
        },
        // destroy handler stops requests
        onExit: function () {
            this.stopRequests();
        },
        // trigger to show the configuration UI if the tile is pressed in Admin mode
        onPress: function (oEvent) {
            var oView = this.getView(),
                oViewData = oView.getViewData(),
                oTileApi = oViewData.chip;
            if (oTileApi.configurationUi.isEnabled()) {
                oTileApi.configurationUi.display();
            }
            else if(this.navigationTargetUrl){
                if(this.navigationTargetUrl[0] === '#'){
                    hasher.setHash(this.navigationTargetUrl);
                }
                else{
                    window.open(this.navigationTargetUrl, '_blank');
                }
            }
        },
        // dynamic data updater
        onUpdateDynamicData: function () {
            var oView = this.getView(),
                oConfig = oView.getModel().getProperty("/config"),
                nservice_refresh_interval = oConfig.service_refresh_interval;
            if (!nservice_refresh_interval) {
                nservice_refresh_interval = 0;
            } else if (nservice_refresh_interval < 10) {
                // log in English only
                jQuery.sap.log.warning(
                    "Refresh Interval " + nservice_refresh_interval
                        + " seconds for service URL " + oConfig.service_url
                        + " is less than 10 seconds, which is not supported. "
                        + "Increased to 10 seconds automatically.",
                    null,
                    "ColourfulDynamicTile.ColourfulDynamicTile"
                );
                nservice_refresh_interval = 10;
            }
            if (oConfig.service_url) {
                this.loadData(oView, nservice_refresh_interval);
            }
        },
        extractData : function (oData) {
            var name,
                aKeys = ["results", "icon", "title", "number", "numberUnit", "info", "infoState", "infoStatus", "targetParams", "subtitle", "stateArrow", "numberState", "numberDigits", "numberFactor", "bgColour"];

            if (typeof oData === "object" && Object.keys(oData).length === 1) {
                name = Object.keys(oData)[0];
                if (jQuery.inArray(name, aKeys) === -1) {
                    return oData[name];
                }
            }
            return oData;
        },
        // configuration save handler
        onSaveConfiguration: function (oConfigurationView) {
            var
            // the deferred object required from the configurationUi contract
                oDeferred = jQuery.Deferred(),
                oModel = oConfigurationView.getModel(),
            // tile model placed into configuration model by getConfigurationUi
                oTileModel = oModel.getProperty("/tileModel"),
                oTileApi = oConfigurationView.getViewData().chip,
                aTileNavigationActions = sap.ushell.components.tiles.utils.tileActionsRows2TileActionsArray(oModel.getProperty("/config/tile_actions_rows")),
            // get the configuration to save from the model
                configToSave = {
                    display_icon_url : oModel.getProperty("/config/display_icon_url"),
                    display_title_text: oModel.getProperty("/config/display_title_text"),
                    display_subtitle_text: oModel.getProperty("/config/display_subtitle_text"),
                    display_info_text: oModel.getProperty("/config/display_info_text"),
                    bgColour: oModel.getProperty("/config/bgColour"),
                    display_number_unit : oModel.getProperty("/config/display_number_unit"),
                    service_url: oModel.getProperty("/config/service_url"),
                    service_refresh_interval: oModel.getProperty("/config/service_refresh_interval"),
                    navigation_use_semantic_object : oModel.getProperty("/config/navigation_use_semantic_object"),
                    navigation_target_url : oModel.getProperty("/config/navigation_target_url"),
                    navigation_semantic_object : jQuery.trim(oModel.getProperty("/config/navigation_semantic_object")) || "",
                    navigation_semantic_action : jQuery.trim(oModel.getProperty("/config/navigation_semantic_action")) || "",
                    navigation_semantic_parameters : jQuery.trim(oModel.getProperty("/config/navigation_semantic_parameters")),
                    display_search_keywords: oModel.getProperty("/config/display_search_keywords")
                };
            //If the input fields icon, semantic object and action are failing the input validations, then through an error message requesting the user to enter/correct those fields
            var bReject = sap.ushell.components.tiles.utils.checkInputOnSaveConfig(oConfigurationView);
            if(bReject) {
                oDeferred.reject("mandatory_fields_missing");
                return oDeferred.promise();
            }
            // overwrite target URL in case of semantic object navigation
            if (configToSave.navigation_use_semantic_object) {
                configToSave.navigation_target_url = sap.ushell.components.tiles.utils.getSemanticNavigationUrl(configToSave);
                oModel.setProperty("/config/navigation_target_url", configToSave.navigation_target_url);
            }

            // use bag contract in order to store translatable properties
            var tilePropertiesBag = oTileApi.bag.getBag('tileProperties');
            tilePropertiesBag.setText('display_title_text', configToSave.display_title_text);
            tilePropertiesBag.setText('display_subtitle_text', configToSave.display_subtitle_text);
            tilePropertiesBag.setText('display_info_text', configToSave.display_info_text);
            tilePropertiesBag.setText('display_search_keywords', configToSave.display_search_keywords);
            	
            var tileNavigationActionsBag = oTileApi.bag.getBag('tileNavigationActions');
            //forward populating of tile navigation actions array into the bag, to Utils
            sap.ushell.components.tiles.utils.populateTileNavigationActionsBag(tileNavigationActionsBag, aTileNavigationActions);

            function logErrorAndReject(oError) {
                jQuery.sap.log.error(oError, null, "ColourfulDynamicTile.ColourfulDynamicTile");
                oDeferred.reject(oError);
            }

            //var that = this;
            // use configuration contract to write parameter values
            oTileApi.writeConfiguration.setParameterValues(
                {tileConfiguration : JSON.stringify(configToSave)},
                // success handler
                function () {
                    //var oConfigurationConfig = sap.ushell.components.tiles.utils.getConfiguration(oTileApi, false, false),
                	var oConfigurationConfig = utils.utils.getConfiguration(oTileApi, false, false),
                    // get tile config data in admin mode
                       //oTileConfig = sap.ushell.components.tiles.utils.getConfiguration(oTileApi, true, false),
                       oTileConfig = utils.utils.getConfiguration(oTileApi, true, false),
                    // switching the model under the tile -> keep the tile model
                        oModel = new sap.ui.model.json.JSONModel({
                            config: oConfigurationConfig,
                            // keep tile model
                            tileModel: oTileModel
                        });
                    oConfigurationView.setModel(oModel);

                    // update tile model
                    oTileModel.setData({data: oTileConfig, nav: {navigation_target_url: ""}}, false);
                    if (oTileApi.preview) {
                        oTileApi.preview.setTargetUrl(oConfigurationConfig.navigation_target_url);
                        oTileApi.preview.setPreviewIcon(oConfigurationConfig.display_icon_url);
                        oTileApi.preview.setPreviewTitle(oConfigurationConfig.display_title_text);
                    }

                    tilePropertiesBag.save(
                        // success handler
                        function () {
                            jQuery.sap.log.debug("property bag 'tileProperties' saved successfully");
                            // update possibly changed values via contracts
                            if (oTileApi.title) {
                                oTileApi.title.setTitle(
                                    configToSave.display_title_text,
                                    // success handler
                                    function () {
                                        oDeferred.resolve();
                                    },
                                    logErrorAndReject // error handler
                                );
                            } else {
                                oDeferred.resolve();
                            }
                        },
                        logErrorAndReject // error handler
                    );

                    tileNavigationActionsBag.save(
                            // success handler
                            function () {
                                jQuery.sap.log.debug("property bag 'navigationProperties' saved successfully");
                            },
                            logErrorAndReject // error handler
                    );
                },
                logErrorAndReject // error handler
            );

            return oDeferred.promise();
        },

        // configuration cancel handler
       
        onCancelConfiguration: function (oConfigurationView) {
            // re-load old configuration and display
            //var that = this;
        	var oViewData = oConfigurationView.getViewData(),
                oModel = oConfigurationView.getModel(),
            // tile model placed into configuration model by getConfigurationUi
                oTileModel = oModel.getProperty("/tileModel"),
                oTileApi = oViewData.chip,
               //oCurrentConfig = sap.ushell.components.tiles.utils.getConfiguration(oTileApi, false, false);
               oCurrentConfig = utils.utils.getConfiguration(oTileApi, false, false);
            oConfigurationView.getModel().setData({config: oCurrentConfig, tileModel: oTileModel}, false);
        },
        // loads data from backend service
        loadData: function (oDynamicTileView, nservice_refresh_interval) {
            var oConfig = oDynamicTileView.getModel().getProperty("/config"),
                sUrl = oConfig.service_url,
                that = this;
            var oTileApi = this.getView().getViewData().chip;

            if (/;o=([;\/?]|$)/.test(sUrl)) { // URL has placeholder segment parameter ;o=
                sUrl = oTileApi.url.addSystemToServiceUrl(sUrl);
            }
            //set the timer if required
            if (nservice_refresh_interval > 0) {
                // log in English only
                jQuery.sap.log.info(
                    "Wait " + nservice_refresh_interval + " seconds before calling "
                        + oConfig.service_url + " again",
                    null,
                    "ColourfulDynamicTile.ColourfulDynamicTile.controller"
                );
                // call again later
                this.timer = setTimeout(that.loadData.bind(that, oDynamicTileView, nservice_refresh_interval, false), (nservice_refresh_interval * 1000));
            }

            // Verify the the Tile visibility is "true" in order to issue an oData request
            if(oTileApi.visible.isVisible() && !that.oDataRequest){
                that.oDataRequest = OData.read(
                    {requestUri: sUrl},
                    // sucess handler
                    function (oResult) {
                        that.oDataRequest = undefined;
                        var oData = oResult,
                            oDataToDisplay;
                        if (typeof oResult === "object") {
                            oData = that.extractData(oData);
                        } else if (typeof oResult === "string") {
                            oData = {number: oResult};
                        }
                        //oDataToDisplay = sap.ushell.components.tiles.utils.getDataToDisplay(oConfig, oData);
                        oDataToDisplay = utils.utils.getDataToDisplay(oConfig, oData);

                        //oDataToDisplay.bgColour = oConfig.bgColour;
                        // set data to display
                        oDynamicTileView.getModel().setProperty("/data", oDataToDisplay);

                        // rewrite target URL
                        oDynamicTileView.getModel().setProperty("/nav/navigation_target_url",
                            sap.ushell.components.tiles.utils.addParamsToUrl(
                            that.navigationTargetUrl,
                            oDataToDisplay
                        ));
                    },
                    // error handler
                    function (oMessage) {
                        that.oDataRequest = undefined;
                        var sMessage = oMessage && oMessage.message ? oMessage.message : oMessage,
                            oResourceBundle = sap.ushell.components.tiles.utils.getResourceBundleModel()
                                .getResourceBundle();
                        if (oMessage.response) {
                            sMessage += " - " + oMessage.response.statusCode + " "
                                + oMessage.response.statusText;
                        }
                        // log in English only
                        jQuery.sap.log.error(
                            "Failed to update data via service "
                                + oConfig.service_url
                                + ": " + sMessage,
                            null,
                            "ColourfulDynamicTile.ColourfulDynamicTile"
                        );
                        oDynamicTileView.getModel().setProperty("/data",
                                utils.utils.getDataToDisplay(oConfig, {
                                number: "???",
                                info: oResourceBundle.getText("dynamic_data.error"),
                                infoState: "Critical"
                            })
            );
        }
    ); // End of oData.read
}
},
    // loads data once if not in configuration mode
    refreshHandler: function (oDynamicTileController) {
        var oTileApi = oDynamicTileController.getView().getViewData().chip;
        if (!oTileApi.configurationUi.isEnabled()) {
            oDynamicTileController.loadData(oDynamicTileController.getView(), 0);
        }
        else{
            oDynamicTileController.stopRequests();
        }
    },

    // load data in place in case setting visibility from false to true
    // with no additional timer registered
    visibleHandler: function (isVisible) {
        if (isVisible) {
            this.refreshHandler(this);
        }
    },
    
/*    getConfiguration : function (oTileApi, bAdmin, bEdit) {

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
    },*/
    
    

    });
}());
