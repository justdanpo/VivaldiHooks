//Bookmarks button before AddressBar
//Кнопка с выпадающими закладками перед строкой адреса

vivaldi.jdhooks.onUIReady(function() {

    var React = vivaldi.jdhooks.require('react_React');
    var ReactDOM = vivaldi.jdhooks.require('react_ReactDOM');

    var button = document.createElement('div');
    button.className = 'button-toolbar bookmarksbutton';
    button.innerHTML = vivaldi.jdhooks.require('_svg_panel_bookmarks');

    var hiddenToolbarContainer = document.createElement('div');
    hiddenToolbarContainer.style.width = 0;
    hiddenToolbarContainer.style.zIndex = -1;
    button.appendChild(hiddenToolbarContainer);

    var hiddenToolbarObject = ReactDOM.render(
        React.createElement(
            vivaldi.jdhooks.require('BookmarksBar')
        ),
        hiddenToolbarContainer);

    button.onclick = function(e) {

        var clone = vivaldi.jdhooks.require('_clone');
        var treeSort = vivaldi.jdhooks.require('_treeSort');

        var bookmarkSorting = vivaldi.jdhooks.require('_VivaldiSettings').getSync('BOOKMARKS_PANEL_BOOKMARKSSORT');

        var defaultComparator = treeSort.getDefaultComparator(bookmarkSorting.sortOrder, bookmarkSorting.sortField);

        var comparator = function(first, second) {
            var isFolder = function(treeItem) {
                return !!treeItem && (treeItem.children && treeItem.children.length > 0 || void 0 === treeItem.url)
            };
            if (first.trash) return 1;
            if (second.trash) return -1;
            if (isFolder(first) && !isFolder(second)) return -1;
            if (isFolder(second) && !isFolder(first)) return 1;
            return defaultComparator(first, second);
        };

        var data = clone(vivaldi.jdhooks.require('_BookmarkStore').getBookmarksData());

        if (bookmarkSorting.sortOrder != treeSort.NO_SORTING)
            treeSort.treeSort(data, comparator);

        hiddenToolbarObject.state.renderedArray = data.filter(function(o) {
            return !o.trash
        });
        vivaldi.jdhooks.require('_ShowMenu')(hiddenToolbarObject.getExtenderButtonItems(), null, "bottom", button)(e);
    }

    var addressField = document.querySelector('div.addressfield');
    addressField.parentNode.insertBefore(button, addressField);

});