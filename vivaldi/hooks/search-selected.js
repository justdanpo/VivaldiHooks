//Selected text: "Search for ..." search engine selection in a context menu

vivaldi.jdhooks.onUIReady(function() {

    var submenuitems = {};

    var submenu = chrome.contextMenus.create({
        id: "search-selected-submenu",
        title: vivaldi.jdhooks.require('_getLocalizedMessage')("Search for “%s”"),
        contexts: ["selection"]
    });

    var updateSearchItems = function(key) {
        for (var i in submenuitems) {
            chrome.contextMenus.remove(i);
        }

        submenuitems = {};
        for (var i in key) {
            var id =
                chrome.contextMenus.create({
                    id: "search-selected-submenu-" + key[i].Id,
                    parentId: submenu,
                    title: key[i].Name,
                    contexts: ["selection"]
                })
            submenuitems[id] = key[i].Url;
        }
    };

    chrome.contextMenus.onClicked.addListener(function(menuItem) {
        if ("undefined" !== submenuitems[menuItem.menuItemId]) {
            var url = submenuitems[menuItem.menuItemId].replace("%s", encodeURIComponent(menuItem.selectionText)).replace("%S", menuItem.selectionText);

            vivaldi.jdhooks.require('_PageActions').openURL(url, {
                inCurrent: false,
                inBackground: false,
                isTyped: false
            });
        }
    });

    var settings = vivaldi.jdhooks.require('_VivaldiSettings');
    updateSearchItems(settings.getSync('SEARCH_ENGINES'));

    settings.addListener("SEARCH_ENGINES", function(oldvalue, newvalue, keyname) {
        updateSearchItems(newvalue);
    });

});