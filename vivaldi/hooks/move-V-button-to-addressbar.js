//Move V button to the right of addressbar

(function() {

    var newButton = null;

    //alt key menu
    vivaldi.jdhooks.hookClass('TitleBar', function(reactClass) {

        vivaldi.jdhooks.hookMember(reactClass, 'showMenu', function(hookData, event) {

            if (newButton) {
                hookData.abort();
                return vivaldi.jdhooks.require('_ShowMenu')(
                    vivaldi.jdhooks.require('_CommandManager').getVerticalMenu(this.state.pages),
                    null,
                    "bottom",
                    newButton,
                    null,
                    null,
                    this.activeShortcuts
                )(event);
            }

        }, null);
    });

    vivaldi.jdhooks.onUIReady(function() {

        var titlebar = document.querySelector('#titlebar');
        var toolbar = document.querySelector('#main > .toolbar');

        var moveButton = function(itm) {

            newButton = itm.cloneNode(true);
            newButton.style.position = 'relative';
            newButton.style.height = 'auto';
            newButton.className += ' button-toolbar';
            newButton.onmousedown = function(event) {

                vivaldi.jdhooks.require('_ShowMenu')(
                    vivaldi.jdhooks.require('_CommandManager').getVerticalMenu(
                        vivaldi.jdhooks.require('_PageStore').getPages()
                    ),
                    null, "bottom", newButton
                )(event);

            };

            toolbar.appendChild(newButton);
            itm.style.display = 'none';

            var style = document.createElement('style');
            style.setAttribute('description', 'added by move-V-button-to-extensions.js');
            style.textContent = "#browser #tabs-container.top{ padding-left: 0px }";
            document.head.appendChild(style);
        };

        var vButton = titlebar.querySelector('button.vivaldi');
        if (vButton) moveButton(vButton);

        var obs = new MutationObserver(function(mutations, observer) {

            mutations.forEach(function(mutation) {

                mutation.addedNodes.forEach(function(itm) {
                    if (itm.className === "vivaldi") {
                        moveButton(itm);
                    }
                });

                mutation.removedNodes.forEach(function(itm) {
                    if (itm.className === "vivaldi") {
                        if (newButton) {
                            newButton.parentNode.removeChild(newButton);
                            newButton = null;
                        }
                    }
                });

            });
        });
        obs.observe(titlebar, {
            childList: true,
            subtree: false
        });

    });

})();