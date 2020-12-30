//MiddleClick on New Tab button to Paste And Go
//Клик средней кнопкой мыши по кнопке "[+]" открывает ссылку из буфера

vivaldi.jdhooks.hookModuleExport("tabs_NewTab", "default", exports => {
    const UrlFieldActions = vivaldi.jdhooks.require('_UrlFieldActions')

    return class extends exports {
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

                UrlFieldActions.go([txt], {
                    inCurrent: false,
                    addTypedHistory: true,
                    addTypedSearchHistory: false,
                    enableSearch: true
                })
            }
            return r
        }
    }
})
