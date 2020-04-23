//Zoom with a mouse wheel over a zoom control in a status bar

vivaldi.jdhooks.onUIReady(function () {

    const uaActions = vivaldi.jdhooks.require("_PageZoom")

    let zoomControl = document.querySelector(".toolbar-statusbar .page-zoom-controls")
    if (!zoomControl)
        return;

    Array.from(zoomControl.querySelectorAll("button")).concat(
        Array.from(zoomControl.querySelectorAll("input")).concat(
            Array.from(zoomControl.querySelectorAll("span.zoom-percent")))).
        forEach(control => {
            control.addEventListener("mousewheel", event => {
                if (zoomControl.querySelector(".zoom-percent.disabled")) {

                } else if (control.querySelector('input[type="range"]')) {

                } else {
                    if (event.deltaY > 0)
                        uaActions.pageZoomOut()

                    if (event.deltaY < 0)
                        uaActions.pageZoomIn()
                }
            })

            control.addEventListener("pointerdown", event => {
                if (event.button === 1) {
                    event.preventDefault()
                    event.stopPropagation()
                }
            })

            control.addEventListener("pointerup", event => {
                if (event.button === 1) {
                    uaActions.pageZoomReset()

                    event.stopPropagation()
                    event.preventDefault()
                }
            })
        })
})
