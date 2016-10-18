//Don't show popup thumbnail of active tab
//Не показывать всплывающий эскиз активной вкладки

vivaldi.jdhooks.hookModule('TabStrip', function(moduleInfo) {

    var pageStore = vivaldi.jdhooks.require('_PageStore');

    vivaldi.jdhooks.hookMember(moduleInfo.exports.prototype, 'render', null, function(hookData) {

        if (hookData.retValue && hookData.retValue.props && "function" === typeof hookData.retValue.props.children) {

            var tabstrip = this;

            vivaldi.jdhooks.hookMember(hookData.retValue.props, "children", null, function(hookData, tabs) {

                hookData.retValue.props.children.forEach(function(itm) {

                    if (itm.type.displayName === "Tooltip") {

                        var tab = tabs.find(function(e) {
                            return e.key == itm.props.id
                        });

                        if (tab) {

                            var page = tab.data.tab.get("page");
                            var isgroup = pageStore.isGroup(page.getIn(["extData", "group"]));

                            itm.props.disabled = !tabstrip.props.settings.USE_TOOLTIP || tabstrip.state.isDragging || page.active && !isgroup;
                        }
                    }
                });

                return hookData.retValue;
            });
        }
        return hookData.retValue;
    });

});


vivaldi.jdhooks.hookModule('Tab', function(moduleInfo) {

    var urlUtility = vivaldi.jdhooks.require('_UrlUtility');

    vivaldi.jdhooks.hookMember(moduleInfo.exports.prototype, 'render', null, function(hookData) {

        if (!hookData.retValue.props.title && this.props.settings.USE_TOOLTIP && this.props.page.active && !this.props.isDragged) {
            if (!this.isTabStack(this.props.page)) {
                hookData.retValue.props.title = urlUtility.urls.getDisplayTitle(this.props.page);
            }
        }

        return hookData.retValue;
    });

});