//Close Tab button in Quick Commands

function hookRender(qcPrototype) {

    var style = document.createElement("style");
    style.setAttribute("description", "added by qcCloseTab.js");
    style.textContent =
        ".quick-command:not([data-selected]) .quick-command-close-tab { display: none }" +
        ".quick-command[data-selected] .quick-command-close-tab { background-color: rgba(0, 0, 0, .15)}";
    document.head.appendChild(style);

    vivaldi.jdhooks.hookMember(qcPrototype, "render", null, function(hookData) {
        if ("openTab" == this.props.item.type) {

            var React = vivaldi.jdhooks.require("react_React");
            var getLocalizedMessage = vivaldi.jdhooks.require("_getLocalizedMessage");

            var this_quickCommandItem = this;

            hookData.retValue.props.children.push(
                React.createElement("span", {
                    className: "quick-command-close-tab",
                    title: getLocalizedMessage("Close Tab"),
                    dangerouslySetInnerHTML: {
                        __html: vivaldi.jdhooks.require("_svg_btn_delete")
                    },
                    onClick: function(e) {
                        e.stopPropagation();

                        var downloadTabPageStore = vivaldi.jdhooks.require("_PageStore");

                        var page = downloadTabPageStore.getPages().find(function(page) {
                            return page.get("id") === this_quickCommandItem.props.item.id
                        });

                        if (page) {
                            vivaldi.jdhooks.require("_PageActions").closePage(page);

                            this_quickCommandItem.props.onItemClick({
                                type: "jdhooks_refresh_qc",
                                id: this_quickCommandItem.props.item.id
                            })
                        }
                    }
                })
            );
        }

        return hookData.retValue;
    });
}

vivaldi.jdhooks.hookModule("QuickCommandItem", function(moduleInfo, exportsInfo) {
    hookRender(exportsInfo.exports.prototype);
});
vivaldi.jdhooks.hookModule("QuickCommandItemObsolete", function(moduleInfo, exportsInfo) {
    hookRender(exportsInfo.exports.prototype);//todo: remove after 1.11final
});


vivaldi.jdhooks.hookSettingsWrapper("QuickCommandSearch", function(fn, settingsKeys) {
    vivaldi.jdhooks.hookMember(fn.prototype, "componentWillMount", function(hookData) {
        var _this = this;
        vivaldi.jdhooks.hookMember(this, "executeCommand", function(hookData, cmd) {
            if (cmd.type === "jdhooks_refresh_qc") {
                var idx = _this.qclist.props.renderedArray.findIndex(function(i) {
                    return i.id == cmd.id
                });
                if (-1 < idx) _this.qclist.props.renderedArray.splice(idx, 1);
                _this.qclist.rerenderVisibleTreeItems();
                hookData.abort();
            }
        });
    });
});