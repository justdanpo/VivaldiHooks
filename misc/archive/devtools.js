//docked devtools

vivaldi.jdhooks.onUIReady(function() {

    var mymenuitem = chrome.contextMenus.create({
        id: "inspectorhookright",
        title: "DevTools at the right",
        contexts: ["all"]
    });
    var mymenuitem2 = chrome.contextMenus.create({
        id: "inspectorhookbottom",
        title: "DevTools at the bottom",
        contexts: ["all"]
    });

    chrome.contextMenus.onClicked.addListener(function(menuItem, x) {

        var right;

        if (mymenuitem === menuItem.menuItemId)
            right = true;
        else
        if (mymenuitem2 === menuItem.menuItemId)
            right = false;
        else
            return;

        if (!document.querySelector("#browser.hasfocus"))
            return;

        //.webpageview div 
        //  .wabpage webview
        //  .internal-page
        var webpageview = document.querySelector(".webpageview.active");
        var webpagediv = document.querySelector(".webpageview.active > div");
        var webpage = webpageview.querySelector(".webpage");
        var webview = webpageview.querySelector("webview");

        var inspector = webpageview.querySelector("#inspectorhook");
        if (inspector) {
            inspector.parentNode.removeChild(inspector);
            webpage.focus();
            return;
        }
        //----------------------------------------------------

        var debugServerUrl = "http://localhost:9222";

        var showInspector = function(url, right) {

            webpage.style.display = "flex";
            webpage.style.flexDirection = right ? "row" : "column";
            webpage.style.width = "100%";
            webpage.style.height = "100%";

            webview.style.display = "flex";
            webview.style.flex = "1";
            webview.style.position = "relative";
            webview.style.width = "100%";
            webview.style.height = "100%";

            var newWebViewContainer = document.createElement("div");
            newWebViewContainer.id = "inspectorhook";
            newWebViewContainer.style.display = "flex";
            webpage.appendChild(newWebViewContainer);

            var setBasis = function(val) {
                newWebViewContainer.style.flex = "0 0 " + val + "px";
            };

            setBasis((right ? webpageview.getBoundingClientRect().width : webpageview.getBoundingClientRect().height) / 2);

            var React = vivaldi.jdhooks.require("react_React");
            var ReactDOM = vivaldi.jdhooks.require("react_ReactDOM");

            ReactDOM.render(
                React.createElement("div", {
                        style: {
                            position: "relative",
                            width: "100%",
                            height: "100%"
                        }
                    },

                    React.createElement(
                        vivaldi.jdhooks.require("SlideBar"), {
                            position: right ? "right" : "bottom",
                            onSlidebarPosition: function(x, y) {
                                var rect = newWebViewContainer.getBoundingClientRect(); //.getClientRects()[0]?
                                setBasis(right ? (rect.width + rect.left - x) : (rect.height + rect.top - y));
                            }

                        }
                    ),

                    React.createElement("webview", {
                        style: {
                            width: "100%",
                            height: "100%",
                        },
                        src: url,
                    })
                ),
                newWebViewContainer
            );
        };


        var htmlRequest = new XMLHttpRequest();
        htmlRequest.onreadystatechange = function() {
            if (4 == this.readyState) {
                if (this.status === 200) {

                    showInspector(debugServerUrl + JSON.parse(this.response)[0].devtoolsFrontendUrl, right);

                } else {

                    var dialogEvent = new Event("dialog");
                    dialogEvent.url = "";
                    dialogEvent.dialogtype = "javascript";
                    dialogEvent.messageType = "alert";
                    dialogEvent.messageText = "Please run Vivaldi with the following command line key:\n --remote-debugging-port=9222";
                    dialogEvent.dialog = {
                        ok: function() {},
                        cancel: function() {},
                    };
                    webview.dispatchEvent(dialogEvent);

                }
            }
        };
        htmlRequest.open("GET", debugServerUrl + "/json/list", true);
        htmlRequest.send();

    })
});