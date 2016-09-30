//MiddleClick on New Tab button to Paste And Go
//Клик средней кнопкой мыши по кнопке "[+]" открывает ссылку из буфера

vivaldi.jdhooks.onUIReady(function() {

    var newtabbutton = document.querySelector('div.tab-strip > button.button-tabbar');

    newtabbutton.addEventListener('click', function(e) {

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

});