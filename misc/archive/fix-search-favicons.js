//Fix Search Engines favicons
//Исправление иконок поисковиков

(function() {

    var getFavicon = function(defaultimage, iconurl) {
        if (defaultimage) return defaultimage;
        if (!iconurl) return iconurl;

        var url = vivaldi.jdhooks.require('url');
        var loc = url.parse(iconurl);
        return "chrome://favicon/" + loc.protocol + '//' + loc.hostname + (loc.port ? ':' + loc.port : '');
    };

    var findElement = function(obj, compare, recursive = false) {
        if (!obj || !obj['props'] || !obj['props']['children']) return false;
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

    //urlfield search icon
    vivaldi.jdhooks.hookClass('UrlBar', function(reactClass) {

        vivaldi.jdhooks.hookMember(reactClass, 'render', null, function(hookData) {

            var addressfield = findElement(hookData.retValue, function(o) {
                return o.ref == "addressfield"
            });
            if (addressfield) {
                var icon =
                    findElement(
                        addressfield,
                        function(o) {
                            return ('object' === typeof o) && o['props'] && (o.props.className == "searchengine-icon")
                        }
                    );
                if (icon) {
                    var i = this._getTypedSearchEngine(this.props.searchEngines, this.state.editUrl);
                    icon.props.src = getFavicon(i.Image, i.Url);
                }
            }
            return hookData.retValue;
        });
    });

    //searchfield dropdown
    vivaldi.jdhooks.hookClass('SearchField', function(reactClass) {

        vivaldi.jdhooks.hookMember(reactClass, 'renderSearchEngines', null, function(hookData) {
            for (var i in hookData.retValue.props.store) {
                if (!hookData.retValue.props.store[i].icon) {
                    hookData.retValue.props.store[i].icon = getFavicon(false, hookData.retValue.props.store[i].url);
                }
            }
            return hookData.retValue;
        });
    });

    //settings
    vivaldi.jdhooks.hookClass('SearchEngines', function(reactClass) {

        vivaldi.jdhooks.hookMember(reactClass, 'renderList', null, function(hookData) {
            for (var i in hookData.retValue) {
                var icon =
                    findElement(
                        hookData.retValue[i],
                        function(o) {
                            return ('object' === typeof o) && o['props'] && (o.props.className == "favicon")
                        }, true
                    );
                if (icon) {
                    icon = icon.props.children;
                    if (icon.props.src.indexOf('chrome://favicon/') === 0) {
                        icon.props.src = getFavicon(false, icon.props.src.substr('chrome://favicon/'.length));
                    }
                }
            }
            return hookData.retValue;
        });
    });

    vivaldi.jdhooks.hookClass('OmniDropdown', function(reactClass) {

        //suggestions/hystory
        vivaldi.jdhooks.hookMember(reactClass, 'renderLinkItem', null, function(hookData, e, t) {
            var icon =
                findElement(
                    hookData.retValue,
                    function(o) {
                        return ('object' === typeof o) && o['props'] && (o.props.className == "favicon")
                    }, true
                );

            if (e.type !== "OMNI_RESULT_SUGGEST" && e.url)
                icon.props.src = getFavicon(false, e.url);
            else if ((e.type == "OMNI_RESULT_SUGGEST") && !this.props.typedSearchEngine) {
                icon.props.src = getFavicon(this.props.defaultSearchEngine.Image, this.props.defaultSearchEngine.Url)
            } else if (this.props.typedSearchEngine) {
                icon.props.src = getFavicon(this.props.typedSearchEngine.Image, this.props.typedSearchEngine.Url)
            }
            return hookData.retValue;
        });

        //dropdown: "search 'xxx'"
        vivaldi.jdhooks.hookMember(reactClass, 'renderURLSearch', null, function(hookData) {

            var icon =
                findElement(
                    hookData.retValue,
                    function(o) {
                        return ('object' === typeof o) && o['props'] && (o.props.className == "favicon")
                    }, true
                );

            if (icon && !icon.props.src) {
                icon.props.src = getFavicon((this.props.typedSearchEngine || this.props.defaultSearchEngine).Image, (this.props.typedSearchEngine || this.props.defaultSearchEngine).Url);
            }
            return hookData.retValue;
        });
    });

})();