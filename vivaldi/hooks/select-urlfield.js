//Select urlfield text on right click
//Выделение адресной строки при правом клике

vivaldi.jdhooks.hookClass('UrlField', function(reactClass) {
    vivaldi.jdhooks.hookMember(reactClass, 'onMouseDown', function(hookData, event) {

        if ((event.button === 2) && (event.target !== document.activeElement)) {
            event.target.select();
        }
    });
});