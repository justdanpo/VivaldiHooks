//Current search engine icon in SearchField

vivaldi.jdhooks.hookModule("VivaldiDropdown", function(moduleInfo, exportsInfo) {

    var React = vivaldi.jdhooks.require("react_React");
    var vs = vivaldi.jdhooks.require("_VivaldiSettings");

    vivaldi.jdhooks.hookMember(exportsInfo.exports.prototype, "componentDidMount", function(hookData) {

        function doClickOutside(clickOutside) {

            vivaldi.jdhooks.hookMember(clickOutside.refs.instance, "onItemClicked", null, function(hookData, searchEngine) {

                var searchEngineId = searchEngine.hasOwnProperty("Id") ? searchEngine.Id : searchEngine.id; //todo: remove after 1.11final
                if (clickOutside._jdhooks_se_icon_currentSearchItemId != searchEngineId) {
                    clickOutside._jdhooks_se_icon_currentSearchItemId = searchEngineId;
                    clickOutside.props.someworkaround = true;
                    clickOutside.forceUpdate();
                }

                return hookData.retValue;
            });


            vivaldi.jdhooks.hookMember(clickOutside.refs.instance, "renderTrigger",
                function(hookData) {
                    //this == VivaldiDropdown

                    if (undefined == clickOutside._jdhooks_se_icon_currentSearchItemId) {
                        var secollection = vs.getSync("SEARCH_ENGINE_COLLECTION");
                        if (secollection) {
                            clickOutside._jdhooks_se_icon_currentSearchItemId = secollection.current;
                            if (undefined == clickOutside._jdhooks_se_icon_currentSearchItemId)
                                clickOutside._jdhooks_se_icon_currentSearchItemId = secollection.default;
                        }

                        if (undefined == clickOutside._jdhooks_se_icon_currentSearchItemId) { //todo: remove after 1.11final
                            clickOutside._jdhooks_se_icon_currentSearchItemId = vs.getSync("CURRENT_SEARCH_ENGINE");
                            if (undefined == clickOutside._jdhooks_se_icon_currentSearchItemId)
                                clickOutside._jdhooks_se_icon_currentSearchItemId = vs.getSync("DEFAULT_SEARCH_ENGINE");
                        }
                    }

                    var searchEngine = clickOutside.props.store.find(function(searchEngine) {
                        var searchEngineId = searchEngine.hasOwnProperty("Id") ? searchEngine.Id : searchEngine.id; //todo: remove after 1.11final
                        return searchEngineId == clickOutside._jdhooks_se_icon_currentSearchItemId;
                    })

                    if (undefined == searchEngine) {
                        if (clickOutside.props.store.length == 0)
                            return;
                        else
                            searchEngine = clickOutside.props.store[0];
                    }

                    hookData.abort();

                    var newButton =
                        React.createElement("button", {
                                className: "button-addressfield searchfield-current-engine",
                                style: {
                                    display: "flex",
                                },
                                onClick: function(event) {
                                    if (!dropdownIsExpanded) this.expand();
                                }.bind(this),
                                onMouseDown: function(event) {
                                    dropdownIsExpanded = this.isExpanded();
                                }.bind(this)

                            },
                            React.createElement("img", {
                                className: "searchfield-current-engine-icon",
                                src: searchEngine.icon ? searchEngine.icon : "chrome://favicon/origin/" + searchEngine.url,
                                style: {
                                    margin: "auto",
                                    width: 16,
                                    height: 16
                                }
                            }),
                            React.createElement("span", {
                                className: "searchfield-current-engine-dropdown",
                                dangerouslySetInnerHTML: {
                                    __html: vivaldi.jdhooks.require("_svg_btn_dropdown")
                                },
                                style: {
                                    margin: "auto",
                                    width: 16,
                                    height: 16
                                }
                            })
                        );

                    return newButton;

                }
            );

            clickOutside.refs.instance.forceUpdate();
        }


        if ("search" === this.props.type) doClickOutside(this);
    })
})