//MiddleClick on New Tab button to Paste And Go
//Клик средней кнопкой мыши по кнопке "[+]" открывает ссылку из буфера

vivaldi.jdhooks.hookModule("tabs_newtab", function (moduleInfo, exportsInfo) {
    let React = vivaldi.jdhooks.require("React")

    class mynew extends exportsInfo.exports {

        render() {
            let r = super.render()

            r.props.onMiddleClick = event => {
                let txt
                function getClipboard(t) {
                    if (t.clipboardData.types.indexOf("text/plain") > -1) {
                        txt = t.clipboardData.getData("text/plain")
                        t.preventDefault()
                    }
                }
                document.addEventListener("paste", getClipboard)
                document.execCommand("paste")
                document.removeEventListener("paste", getClipboard)

                vivaldi.jdhooks.require('_UrlFieldActions').go([txt], {
                    inCurrent: !1,
                    addTypedHistory: !0,
                    addTypedSearchHistory: !1,
                    enableSearch: !0
                })
            }

            return r
        }

        constructor(props, ...e) { super(props, ...e) }
    }
    exportsInfo.exports = mynew
})
