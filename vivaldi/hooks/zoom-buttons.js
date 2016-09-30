//+/- Zoom buttons in a status bar

vivaldi.jdhooks.onUIReady(function() {

    var uaActions = vivaldi.jdhooks.require('_UIActions');

    var zoomRange = document.querySelector('.zoom-control > input[type="range"]');

    var minus = document.createElement('button');
    minus.className = "button-toolbar-small";
    minus.textContent = "-";
    minus.onclick = function() {
        if (!zoomRange.disabled)
            uaActions.zoomOut();
    };

    zoomRange.parentNode.insertBefore(minus, zoomRange);

    var plus = document.createElement('button');
    plus.className = "button-toolbar-small";
    plus.textContent = "+";
    plus.onclick = function() {
        if (!zoomRange.disabled)
            uaActions.zoomIn();
    };

    zoomRange.parentNode.insertBefore(plus, zoomRange.nextSibling);

});