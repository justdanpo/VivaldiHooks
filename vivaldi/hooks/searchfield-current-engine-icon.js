//Current search engine icon in SearchField

vivaldi.jdhooks.hookClass('VivaldiDropdown', function(reactClass) {

    var React = vivaldi.jdhooks.require('react_React');
    var vs = vivaldi.jdhooks.require('_VivaldiSettings');

    vivaldi.jdhooks.hookMember(reactClass, 'onItemClicked', null, function(hookData, searchEngine) {
        if ("search" == this.props.type) {
            if (this.props._jdhooks_se_icon_currentSearchItemId != searchEngine.Id) {
                this.props._jdhooks_se_icon_currentSearchItemId = searchEngine.Id;
                this.forceUpdate();
            }
        }
        return hookData.retValue;
    });

    vivaldi.jdhooks.hookMember(reactClass, 'renderTrigger',
        function(hookData) {
            if ("search" == this.props.type) {
            	
                if (undefined == this.props._jdhooks_se_icon_currentSearchItemId) this.props._jdhooks_se_icon_currentSearchItemId = vs.getSync('CURRENT_SEARCH_ENGINE');

            	var _tempId=this.props._jdhooks_se_icon_currentSearchItemId;
                var searchEngine = this.props.store.find(function(_) {
                    return _.Id == _tempId;
                })

                if (undefined == searchEngine) {
                    if (this.props.store.length == 0)
                        return;
                    else
                        searchEngine = this.props.store[0];
                }

                hookData.abort();

                var newButton =
                    React.createElement('button', {
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
                                __html: vivaldi.jdhooks.require('_svg_btn_dropdown')
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
        }
    );
});