//Zoom with a mouse wheel over a zoom control in a status bar

vivaldi.jdhooks.onUIReady(function () {

    var uaActions = vivaldi.jdhooks.require("_PageZoom");

    var zoomControl = document.querySelector(".page-zoom-controls");
    if (!zoomControl)
        return;

    var range = zoomControl.querySelector("input");

    zoomControl.addEventListener("mousewheel", function (event) {
        if (range && range.disabled) {

        } else if (zoomControl.querySelector('input[type="range"]')) {

        } else {
            if (event.deltaY > 0)
                uaActions.pageZoomOut();

            if (event.deltaY < 0)
                uaActions.pageZoomIn();
        }
    })

    zoomControl.addEventListener("mouseup", function (event) {
        if (event.button === 1) {
            uaActions.pageZoomReset();

            event.stopPropagation();
            event.preventDefault();
        }
    });

    zoomControl.addEventListener("click", function (event) {
        if (event.button === 1) {
            event.stopPropagation();
            event.preventDefault();
        }
    });
});