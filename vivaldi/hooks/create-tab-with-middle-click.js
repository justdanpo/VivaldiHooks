//Create tab with middle click on a free tabbar space
//Создание вкладки кликом колесом по свободной области панели вкладок

vivaldi.jdhooks.onUIReady(function() {

    var tabspacer = document.createElement('div');
    tabspacer.className = "tab-spacer";
    tabspacer.style.cssText = 'top: 0px; left: 0px; height: 100%; width: 100%; position: absolute; -webkit-app-region: no-drag;';

    var tabstrip = document.querySelector('#tabs-container > div.resize > div.tab-strip');
    tabstrip.parentNode.insertBefore(tabspacer, tabstrip);

    tabstrip.ondblclick = function(event) {
        if (1 === event.button) {
            event.preventDefault();
            event.stopPropagation();
        }
    };
});