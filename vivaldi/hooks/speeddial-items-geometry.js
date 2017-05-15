//1.5.676.6+!
//Setup Speed Dial items geometry
//Настройка размеров элементов экспресс-панели

(function() {

    var findElement = function(obj, compare, recursive = false) {
        if (!obj || !obj['props'] || !obj['props']['children']) return false;
        if ('[object Array]' === Object.prototype.toString.call(obj.props.children))
            for (var i in obj.props.children) {
                if (compare(obj.props.children[i]))
                    return obj.props.children[i];
                if (recursive) {
                    var ret = findElement(obj.props.children[i], compare, recursive);
                    if (false !== ret)
                        return ret;
                }
            }
        return false;
    }

    vivaldi.jdhooks.hookModule('VivaldiSettingsWrapper', function(moduleInfo) {
        vivaldi.jdhooks.hookMember(moduleInfo, 'exports', function(hookData, fn, settingsKeys) {
            if (fn) {
                if (fn.displayName === 'Appearance') {
                    settingsKeys.push("JDHOOKS_DIALWIDTH", "JDHOOKS_DIALMARGIN");
                }
            }
        });
    });

    vivaldi.jdhooks.hookClass('Appearance', function(reactClass) {
        if (undefined !== reactClass.setBackgroundImage) {

            var settingSaveCallback = function(settingKey, eventProperty, event) {
                vivaldi.jdhooks.require('_VivaldiSettings').set({
                    [settingKey]: event.target[eventProperty]
                });
            };

            var React = vivaldi.jdhooks.require('react_React');

            vivaldi.jdhooks.hookMember(reactClass, 'render', null, function(hookData) {

                var settingKeys = this.props.vivaldiSettings;

                var maxColumns = findElement(hookData.retValue, function(o) {
                    if (!o.props) return false;
                    return o.props.className == "max-columns"
                }, true);
                if (maxColumns) {
                    while (maxColumns.props.children.length < 20) {
                        maxColumns.props.children.push(

                            React.createElement("option", {
                                value: maxColumns.props.children.length + 1

                            }, maxColumns.props.children.length + 1)
                        );
                    }

                    if (!settingKeys.JDHOOKS_DIALWIDTH) settingKeys.JDHOOKS_DIALWIDTH = 240;
                    if (!settingKeys.JDHOOKS_DIALMARGIN) settingKeys.JDHOOKS_DIALMARGIN = 20;

                    hookData.retValue.props.children.push(

                        React.createElement("div", {
                                className: "setting-group"
                            },
                            React.createElement("h3", {}, "Dial Geometry"),

                            React.createElement("div", {
                                    className: "setting-single"
                                },
                                React.createElement("label", {},
                                    React.createElement("input", {
                                        type: "range",
                                        title: "Dial Width",
                                        min: 100,
                                        max: 300,
                                        value: settingKeys.JDHOOKS_DIALWIDTH,
                                        onChange: settingSaveCallback.bind(this, "JDHOOKS_DIALWIDTH", "value"),
                                    }),
                                    React.createElement("span", {}, 'width ' + settingKeys.JDHOOKS_DIALWIDTH)
                                )
                            ),

                            React.createElement("div", {
                                    className: "setting-single"
                                },
                                React.createElement("label", {},
                                    React.createElement("input", {
                                        type: "range",
                                        title: "Distance",
                                        min: 10,
                                        max: 100,
                                        value: settingKeys.JDHOOKS_DIALMARGIN,
                                        onChange: settingSaveCallback.bind(this, "JDHOOKS_DIALMARGIN", "value"),
                                    }),
                                    React.createElement("span", {}, 'spacing ' + settingKeys.JDHOOKS_DIALMARGIN)
                                ))));
                }
                return hookData.retValue;
            });
        }
    });



    vivaldi.jdhooks.hookModule('SpeedDialView', function(moduleInfo) {

        var myDialWidth = 240;
        var myDialMargin = 20;

        function updateDialWidth(width) {
            if (width) myDialWidth = parseInt(width);
            else myDialWidth = 240;
        }

        function updateDialMargin(margin) {
            if (margin) myDialMargin = parseInt(margin);
            else myDialMargin = 20;
        }

        vivaldi.jdhooks.hookMember(moduleInfo.exports.prototype, 'componentDidMount', function(hookData) {
            if (!this.refs.component.createFlexBoxLayout)
                return;

            var settings = vivaldi.jdhooks.require('_VivaldiSettings');

            updateDialWidth(settings.getSync('JDHOOKS_DIALWIDTH'));
            updateDialMargin(settings.getSync('JDHOOKS_DIALMARGIN'));

            settings.addListener("JDHOOKS_DIALWIDTH", function(oldvalue, newvalue, keyname) {
                updateDialWidth(newvalue);
            });

            settings.addListener("JDHOOKS_DIALMARGIN", function(oldvalue, newvalue, keyname) {
                updateDialMargin(newvalue);
            });

            var cssLayout = vivaldi.jdhooks.require('css-layout');


            vivaldi.jdhooks.hookMember(this.refs.component, 'getSpeedDialColumns', function(hookData) {

                hookData.abort();

                return Math.min(this.props.settings.SPEEDDIAL_COLS, parseInt(this.props.maxWidth / (myDialWidth + 2 * myDialMargin)));
            });


            vivaldi.jdhooks.hookMember(this.refs.component, 'render', null, function(hookData) {
                var dial = findElement(hookData.retValue, function(o) {
                    return o && o.ref === "rootElement"
                });

                if (dial)
                    dial.props.style.width = (myDialWidth + 2 * myDialMargin) * this.getSpeedDialColumns();

                return hookData.retValue;
            });


            //was: function(hookData, speedDialFolder, dialWidth, columns) {
            vivaldi.jdhooks.hookMember(this.refs.component, 'createFlexBoxLayout', function(hookData, speedDialFolder, dialRowWidth) {
                hookData.abort();

                var curFolderChildren = speedDialFolder ? speedDialFolder.children : [];

                var layout = {
                    style: {
                        flexDirection: "row",
                        width: (myDialWidth + 2 * myDialMargin) * this.getSpeedDialColumns(), //todo: replace with dialRowWidth
                        flexWrap: "wrap"
                    },
                    children: curFolderChildren.map(function(e) {
                        return {
                            type: "bookmark",
                            key: e.id,
                            node: e,
                            style: {
                                width: myDialWidth,
                                height: .9 * myDialWidth,
                                marginRight: myDialMargin,
                                marginBottom: myDialMargin,
                                marginLeft: myDialMargin
                            }
                        }
                    }).concat({
                        type: "button",
                        key: "button",
                        style: {
                            width: myDialWidth,
                            height: .9 * myDialWidth,
                            marginRight: myDialMargin,
                            marginBottom: myDialMargin,
                            marginLeft: myDialMargin
                        }
                    })
                };

                cssLayout(layout);
                return layout;
            });

            //workaround
            this.refs.component.updater.enqueueForceUpdate(this.refs.component);
        });
    });

})();