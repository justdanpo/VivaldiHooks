//Move V button to the right of addressbar

(function() {

    var style = document.createElement('style');
    style.setAttribute('description', 'added by move-V-button-to-addressbar.js');
    style.textContent =
        "#browser #tabs-container.top{ padding-left: 0px }" +
        "#browser.native:not(.tabs-top):not(.horizontal-menu) #header { display: none } " +
        "#titlebar > .vivaldi { display: none }" +
        "#browser.horizontal-menu .vivaldi-addressbar {display: none }";
    document.head.appendChild(style);

    function showMenu(event) {
        var button = document.querySelector('#browser:not(.horizontal-menu) .vivaldi-addressbar');
        if (button) {
            vivaldi.jdhooks.require('_ShowMenu')(
                vivaldi.jdhooks.require('_CommandManager').getVerticalMenu(
                    vivaldi.jdhooks.require('_PageStore').getPages()
                ),
                null, "bottom", button
            )(event);
            return true;
        }
        return false;
    }

    //alt key menu
    vivaldi.jdhooks.hookClass('TitleBar', function(reactClass) {
        vivaldi.jdhooks.hookMember(reactClass, 'showMenu', function(hookData, event) {
            if (showMenu(event))
                hookData.abort();
        });
    });


    function hookRender(reactClass) {
        vivaldi.jdhooks.hookMember(reactClass, 'render', null, function(hookData) {

            hookData.retValue.props.children.push(
                vivaldi.jdhooks.require('react_React').createElement('div', {
                        className: 'vivaldi-addressbar button-toolbar',
                        ref: 'movedVButton',
                        dangerouslySetInnerHTML: {
                            __html: vivaldi.jdhooks.require(
                                '_svg_vivaldi_title'
                                //'_svg_menu_vivaldi'
                                //'_svg_vivaldi_v'
                            )
                        },
                        onClick: showMenu.bind(this)
                    }

                )
            );

            return hookData.retValue;
        });
    }

    vivaldi.jdhooks.hookClass('UrlBar', function(reactClass) {
        hookRender(reactClass)
    });

    vivaldi.jdhooks.hookClass('MailBar', function(reactClass) {
        hookRender(reactClass)
    });

})();