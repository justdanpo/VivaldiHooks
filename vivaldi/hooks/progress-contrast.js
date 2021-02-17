//Highlight progressbar when website theme color is the same as addressfield background

vivaldi.jdhooks.hookClass("progress_PageloadProgress", oldClass => {
    let chroma = vivaldi.jdhooks.require("chroma.js")

    return class extends oldClass {
        getVars() {
            const oldPcSettings = this.state.pcSettings || {
                progressColor: "",
                bgColor: ""
            }
            const style = getComputedStyle(document.body)
            const newPcSettings = {
                progressColor: style.getPropertyValue("--colorAccentBg"),
                bgColor: style.getPropertyValue("--colorBgInverser")
            }

            if (oldPcSettings != newPcSettings) this.setState({ pcSettings: newPcSettings })
        }

        constructor(...e) {
            super(...e)
            this.getVars()
            this.observer = new MutationObserver(mutations => mutations.forEach((mutationRecord => { this.getVars() }).bind(this)))
        }

        componentDidMount() {
            if (super.componentDidMount) super.componentDidMount()
            this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
        }

        componentWillUnmount() {
            this.observer.disconnect()
            if (super.componentWillUnmount) super.componentWillUnmount()
        }

        render() {
            let r = super.render()
            if (r && r.props && r.props.children && this.state.pcSettings) {

                const colorBg = chroma(this.state.pcSettings.bgColor)
                const colorAccentBg = chroma(this.state.pcSettings.progressColor)

                const mixed = chroma.mix(colorBg, colorAccentBg, .25, "lab")
                if (chroma.distance(colorBg, mixed) < 3) {

                    const lum = colorAccentBg.luminance()
                    const newColorAccentBg = colorAccentBg.luminance(lum > .5 ? lum - .5 : lum + .5)

                    let idx = r.props.children.findIndex(x => x && x.type == "progress")
                    if (idx > -1) {
                        r.props.children[idx].props.style = {
                            opacity: .4,
                            backgroundColor: newColorAccentBg
                        }
                    }
                }
            }
            return r
        }
    }
})
