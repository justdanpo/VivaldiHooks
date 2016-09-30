//Zoom with a mouse wheel over a zoom control in a status bar

vivaldi.jdhooks.onUIReady(function() {

    var uaActions = vivaldi.jdhooks.require('_UIActions');

    var zoomControl = document.querySelector('.zoom-control');
    var range = zoomControl.querySelector('input');

    zoomControl.addEventListener('mousewheel', function(event) {
        if (!range.disabled) {
            if (event.deltaY > 0)
                uaActions.zoomOut();

            if (event.deltaY < 0)
                uaActions.zoomIn();
        }
    })

    zoomControl.addEventListener('click', function(event) {
        if (event.button === 1)
            uaActions.zoomReset();
    });

});