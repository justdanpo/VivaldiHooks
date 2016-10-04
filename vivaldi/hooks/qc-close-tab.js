//Close Tab button in Quick Commands

vivaldi.jdhooks.hookClass('QuickCommandItem', function(reactClass) {

    var style = document.createElement('style');
    style.setAttribute('description', 'added by qcCloseTab.js');
    style.textContent =
        "li:not(:hover) .quick-command-close-tab { display: none }" +
        "li:hover .quick-command-close-tab { background-color: rgba(0, 0, 0, .15)}";
    document.head.appendChild(style);

    vivaldi.jdhooks.hookMember(reactClass, 'render', null, function(hookData) {

        if ("openTab" == this.props.commandObj.type) {

            var React = vivaldi.jdhooks.require('react_React');
            var getLocalizedMessage = vivaldi.jdhooks.require('_getLocalizedMessage');

            var this_quickCommandItem = this;

            hookData.retValue.props.children.push(
                React.createElement("span", {
                    className: "quick-command-close-tab",
                    title: getLocalizedMessage("Close Tab"),
                    dangerouslySetInnerHTML: {
                        __html: vivaldi.jdhooks.require('_svg_btn_delete')
                    },
                    onClick: function(e) {
                        e.stopPropagation();

                        var downloadTabPageStore = vivaldi.jdhooks.require('_PageStore');

                        var page = downloadTabPageStore.getPages().find(function(page) {
                            return page.get("id") === this_quickCommandItem.props.commandObj.id
                        });

                        if (page) {
                            vivaldi.jdhooks.require('_PageActions').closePage(page);
                            e.target.closest('li').style.display = 'none';

                            //var inp = document.querySelector('input.quick-command-search');
                            //inp.onblur = function() {
                            //    inp.focus();
                            //};
                        }
                    }
                })
            );
        }

        return hookData.retValue;

    });

});