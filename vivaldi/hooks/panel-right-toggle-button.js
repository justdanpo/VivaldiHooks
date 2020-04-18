// Moves Panel Toggle button to the right when Panel Position is set to "Right Side"

vivaldi.jdhooks.addStyle(`
#main.right + div .paneltogglefooter {
  order:100
}
`, "panel-right-toggle-button.js")

vivaldi.jdhooks.hookModule("toolbars_toolbar", function (moduleInfo, exports) {
    const React = vivaldi.jdhooks.require("React")

    class mynew extends exports {
        render() {
            let r = super.render()

            let panelToggleIndex = r.props.children.findIndex(c => c.props.name == "PanelToggle")
            if (-1 < panelToggleIndex) {
                r.props.children[panelToggleIndex] = React.createElement("div", { className: "paneltogglefooter" }, r.props.children[panelToggleIndex])
            }

            return r
        }

        constructor(...e) { super(...e) }
    }
    return mynew
})
