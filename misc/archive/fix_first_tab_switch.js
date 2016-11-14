//Fix first Ctrl+Tab swith after startup (recently used order, show tab cycler)
//Исправление первого переключения по Ctrl+Tab (переключение в порядке использования, визуальное переключение)

vivaldi.jdhooks.hookClass('VisualTabSwitcher', function(reactClass) {
    vivaldi.jdhooks.hookMember(reactClass, 'getPagesInOrder', function(hookData) {

        if (vivaldi.jdhooks.require('_VivaldiSettings').getSync("TAB_CYCLING_ORDER") == "recently used") {

            hookData.abort();

            var pages = this.state.pages;

            return vivaldi.jdhooks.require('_PageStore').getPageHistory().map(
                function(id) {
                    return pages.find(function(page) {
                        return page.get("id") === id
                    })
                }).reverse();
        }
    });

});