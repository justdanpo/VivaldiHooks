//Prevent Shift+Alt menu appearance
//Не открывать меню по Shift+Alt

vivaldi.jdhooks.hookClass('TitleBar', function(reactClass) {
    vivaldi.jdhooks.hookMember(reactClass, 'onKeyDown', function(hookData, event) {
        if (event.key === "Alt" && (event.shiftKey || event.ctrlKey)) {
            hookData.abort();
            this.stopMenuDetection();
        }
    });
});