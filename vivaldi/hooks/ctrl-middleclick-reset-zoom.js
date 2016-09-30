//Ctrl+MiddleClick on a webpage contents - reset zoom
//Ctrl+MiddleClick на содержимом страницы - сброс масштаба

vivaldi.jdhooks.onUIReady(function() {

    document.querySelector('.inner').addEventListener('mousedown', function(event) {

        if (event.ctrlKey && event.button === 1 && event.srcElement.nodeName === "WEBVIEW") {

            vivaldi.jdhooks.require('_UIActions').zoomReset();

            event.preventDefault();
        }

    });

});