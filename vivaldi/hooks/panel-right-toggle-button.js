// Moves Panel Toggle button to the right when Panel Position is set to "Right Side"

vivaldi.jdhooks.addStyle(`
#main.right + div .paneltogglefooter {
  order:100
}
`, "panel-right-toggle-button.js")

vivaldi.jdhooks.hookClass("toolbars_Toolbar", origClass => {
    const React = vivaldi.jdhooks.require("React")
    const ReactDom = vivaldi.jdhooks.require("ReactDOM")

    return class extends origClass {
        render() {
            let r = super.render()
            for (let child of r.props.children)
                if (child.props.name == "PanelToggle") child.ref = "paneltoggle"
            return r
        }

        constructor(...e) { super(...e) }

        componentDidMount() {
            if (super.componentDidMount) super.componentDidMount()
            if (this.refs.paneltoggle) {
                let toggleButton = ReactDom.findDOMNode(this.refs.paneltoggle)
                if (toggleButton)
                    toggleButton.classList.add("paneltogglefooter")
            }
        }
    }
})
