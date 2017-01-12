//Select text on searchfield focus
//Выделение текста при активации поля поиска

vivaldi.jdhooks.hookClass('SearchField', function(reactClass) {
    vivaldi.jdhooks.hookMember(reactClass, 'onFocus', function(hookData, event) {

        if (!this.state.focused) {
            this.focusField();
        }

    });
});