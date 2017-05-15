//Copy SearchField text to new tabs on Alt+Enter/Shift+Enter

vivaldi.jdhooks.hookMember(chrome.tabs, 'create', function(hookData) {

    vivaldi.jdhooks.hookMember(hookData.arguments, '1', function(hookData, newTab) {
        if (newTab.openerTabId && newTab.openerTabId != newTab.id) {

            var newPage = vivaldi.jdhooks.require('_updatePage').tabToPage(newTab);

            var oldTab = vivaldi.jdhooks.require('_PageStore').getTabs().find(function(tab) {
                return tab.get("id") === newTab.openerTabId
            });

            var typedHistory = vivaldi.jdhooks.require('_TypedSearchHistory');
            var searchFieldActions = vivaldi.jdhooks.require('_SearchFieldActions');

            searchFieldActions.setState(newPage, {
                editText: typedHistory.getSearchText(oldTab)
            });


        }
    });
})

vivaldi.jdhooks.hookModule('_UrlFieldActions', function(moduleInfo) {
    vivaldi.jdhooks.hookMember(moduleInfo.exports, 'goSearchURL', function(hookData, url, flags) {
        if (!flags.inCurrent) {
            flags.addOpenerTabId = true;
        }
    });
});
