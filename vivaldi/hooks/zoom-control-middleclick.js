//Middleclick in a zoom control to reset zoom

vivaldi.jdhooks.onUIReady(function() {

    var uaActions = vivaldi.jdhooks.require('_UIActions');

    var zoomControl = document.querySelector('.zoom-control');
    var range = zoomControl.querySelector('input');

    zoomControl.addEventListener('mouseup', function(event) {
        if (event.button === 1) {
            uaActions.zoomReset();

            event.stopPropagation();
            event.preventDefault();
        }
    });

    zoomControl.addEventListener('click', function(event) {
        if (event.button === 1) {

            event.stopPropagation();
            event.preventDefault();
        }
    });
});