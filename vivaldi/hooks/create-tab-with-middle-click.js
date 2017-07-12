//Create tab with middle click on a free tabbar space
//Создание вкладки кликом колесом по свободной области панели вкладок

vivaldi.jdhooks.onUIReady(function() {

    function setup(tabstrip) {
        if (!tabstrip) return;

        var tabspacer = document.createElement("div");
        tabspacer.className = "tab-spacer";
        tabspacer.style.cssText = "top: 0px; left: 0px; height: 100%; width: 100%; position: absolute; -webkit-app-region: no-drag;";

        tabstrip.parentNode.insertBefore(tabspacer, tabstrip);

        tabstrip.ondblclick = function(event) {
            if (1 === event.button) {
                event.preventDefault();
                event.stopPropagation();
            }
        };
    }

    setup(document.querySelector("#tabs-container > div.resize > div.tab-strip"));

    var obs = new MutationObserver(function(mutations, observer) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(itm) {
                if (("undefined" !== typeof itm.className) && (itm.className === "tab-strip"))
                    setup(itm);
            });
        });
    });

    var nodeMain = document.querySelector("#main");
    if (nodeMain) {
        obs.observe(nodeMain, {
            childList: true,
            subtree: true
        });
        obs.observe(document.querySelector("#header"), {
            childList: true,
            subtree: true
        });
    }
});