//Zoom with a mouse wheel over a zoom control in a status bar

vivaldi.jdhooks.onUIReady(function() {

    var uaActions = vivaldi.jdhooks.require("_UIActions");

    var zoomControl = document.querySelector(".zoom-control");
    if (!zoomControl)
        return;

    var range = zoomControl.querySelector("input");

    zoomControl.addEventListener("mousewheel", function(event) {
        if (!range.disabled && !zoomControl.querySelector('input[type="range"]')) {
            if (event.deltaY > 0)
                uaActions.zoomOut();

            if (event.deltaY < 0)
                uaActions.zoomIn();
        }
    })

    zoomControl.addEventListener("mouseup", function(event) {
        if (event.button === 1) {
            uaActions.zoomReset();

            event.stopPropagation();
            event.preventDefault();
        }
    });

    zoomControl.addEventListener("click", function(event) {
        if (event.button === 1) {
            event.stopPropagation();
            event.preventDefault();
        }
    });
});