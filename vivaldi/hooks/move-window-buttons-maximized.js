//Move Minimize/Zoom/Close buttons to addressbar when Vivaldi is maximized and tab position is NOT "Top"

vivaldi.jdhooks.onUIReady(function() {

    var buttons = document.querySelector('#titlebar > .window-buttongroup');
    if (buttons) {
        var newButtons = buttons.cloneNode(true);
        newButtons.style.position = 'relative';
        newButtons.style.order = 255;
        newButtons.style.height = 'auto';
        newButtons.className += ' MaximizedWindowButtons';

        var toolbar = document.querySelector('#main > .toolbar');
        toolbar.appendChild(newButtons);

        var style = document.createElement('style');
        style.setAttribute('description', 'added by move-window-buttons-maximized.js');
        style.textContent =
            "#browser:not(.native):not(.horizontal-menu):not(.tabs-top).maximized #header { top:-100px; position:absolute } " +

            "#browser.horizontal-menu .MaximizedWindowButtons, " +
            "#browser.tabs-top .MaximizedWindowButtons, " +
            "#browser:not(.maximized) .MaximizedWindowButtons { display: none } " +

            "#browser .MaximizedWindowButtons button { height: auto }";
        document.head.appendChild(style);

        newButtons.querySelector('.window-close').onclick = function() {
            buttons.querySelector('.window-close').click();
        }
        newButtons.querySelector('.window-minimize').onclick = function() {
            buttons.querySelector('.window-minimize').click();
        }
        newButtons.querySelector('.window-maximize').onclick = function() {
            buttons.querySelector('.window-maximize').click();
        }
    }

});