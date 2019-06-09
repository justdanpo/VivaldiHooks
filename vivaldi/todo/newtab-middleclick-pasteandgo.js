//MiddleClick on New Tab button to Paste And Go
//Клик средней кнопкой мыши по кнопке "[+]" открывает ссылку из буфера

vivaldi.jdhooks.onUIReady(function() {

    var setupButton = function(item) {
        var newtabbutton = item.querySelector('div.tab-strip > button.button-tabbar');

        if (!newtabbutton) return;

        newtabbutton.addEventListener('mouseup', function(e) {

            if (e.button === 1) {

                var txt;
                var getClipboard = function(t) {
                    if (t.clipboardData.types.indexOf("text/plain") > -1) {
                        txt = t.clipboardData.getData("text/plain");
                        t.preventDefault();
                    }
                };
                document.addEventListener("paste", getClipboard);
                document.execCommand("paste");
                document.removeEventListener("paste", getClipboard);

                vivaldi.jdhooks.require('_UrlFieldActions').go(txt, {
                    inCurrent: !1,
                    addTypedHistory: !0,
                    addTypedSearchHistory: !1,
                    enableSearch: !0
                });

                e.stopPropagation();
                e.preventDefault();
            }
        });

        newtabbutton.addEventListener('click', function(e) {

            if (e.button === 1) {

                e.stopPropagation();
                e.preventDefault();
            }
        });
    };
    setupButton(document);


    var obs = new MutationObserver(function(mutations, observer) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(itm) {
                if (("undefined" !== typeof itm.className) && (itm.className === "tab-strip"))
                    setupButton(itm);
            });
        });
    });

    var nodeMain = document.querySelector('#main');
    if (nodeMain) {
        obs.observe(nodeMain, {
            childList: true,
            subtree: true
        });
        obs.observe(document.querySelector('#header'), {
            childList: true,
            subtree: true
        });
    }

});