/* Panel Switch: "Floating Panel" toggle */

vivaldi.jdhooks.addStyle(`
.panelbtn-pin-panel {
    order: 101;
}
`, "panel-floating-toggle.js")

vivaldi.jdhooks.hookClass("panels_panel", cls => {
    const React = vivaldi.jdhooks.require("React")
    const getLocalizedMessage = vivaldi.jdhooks.require("_getLocalizedMessage")
    const PrefKeys = vivaldi.jdhooks.require("_PrefKeys")
    const PrefSet = vivaldi.jdhooks.require("_PrefSet")

    const iconFloatingOff = '<svg viewBox="0 0 9 9" xmlns="http://www.w3.org/2000/svg"><g><rect width="7" height="5" x="1" y="2" style="fill:none;stroke:var(--colorFgFaded);stroke-width:0.6" rx="0.8" ry="0.8"/><path style="fill:none;stroke:var(--colorFgFaded);stroke-width:0.6" d="m 3.5,2 v 4.76015"/></g></svg>'
    const iconFloatingOn = '<svg viewBox="0 0 9 9" xmlns="http://www.w3.org/2000/svg"><g><rect width="7" height="5" x="1" y="2" style="fill:none;stroke:var(--colorFgFaded);stroke-width:0.6" rx="0.8" ry="0.8"/><rect width="2.5" height="3.5" x="1" y="2" style="fill:none;stroke:var(--colorFgFaded);stroke-width:0.6" rx="0.8" ry="0.8"/></g></svg>'

    function finderFromElementArray(r) {
        r.empty = r.length == 0
        r.findChild = cb => {
            if (r.empty) return finderFromElementArray([])
            const children = Array.isArray(r[0].props.children) ? r[0].props.children : [r[0].props.children]
            const idx = children.findIndex(cb)
            if (idx == -1) return finderFromElementArray([])
            return finderFromElementArray([children[idx]])
        }
        r.findChildIndex = cb => {
            if (r.empty) return -1
            const children = Array.isArray(r[0].props.children) ? r[0].props.children : [r[0].props.children]
            return children.findIndex(cb)
        }
        return r
    }

    const FloatingButton = vivaldi.jdhooks.insertWatcher(
        class extends React.PureComponent {
            render() {
                return React.createElement("button", {
                    className: "panelbtn panelbtn-pin-panel",
                    title: getLocalizedMessage("Floating Panel"),
                    tabIndex: this.state.jdPrefs[PrefKeys.kKeyboardTabToAll],
                    onMouseDown: e => e.preventDefault(),
                    onClick: evt => PrefSet.set(
                        PrefKeys.kPanelsAsOverlayEnabled,
                        !this.state.jdPrefs[PrefKeys.kPanelsAsOverlayEnabled]),
                    dangerouslySetInnerHTML: {
                        __html: `<span>${this.state.jdPrefs[PrefKeys.kPanelsAsOverlayEnabled]
                            ? iconFloatingOn
                            : iconFloatingOff}</span>`
                    }
                })
            }
        },
        { prefs: [PrefKeys.kPanelsAsOverlayEnabled, PrefKeys.kKeyboardTabToAll] }
    )

    return class extends cls {
        render() {
            let r = super.render()

            const sw = finderFromElementArray([r])
                .findChild(c => c && c.props && c.props.id == "panels-container")
                .findChild(c => c && c.props && c.props.id == "panels")
                .findChild(c => c && c.props && c.props.id == "switch")
            if (!sw.empty) {
                const prefIndex = sw.findChildIndex(c => c && c.props && c.props["data-id"] == "preferences")
                if (prefIndex > -1) {
                    sw[0].props.children.push(React.createElement(FloatingButton, {}))
                }
            }

            return r
        }
    }
})