//Downloads section in Speed Dial

vivaldi.jdhooks.hookClass("startpage_startpage-topmenu", cls => {
    const React = vivaldi.jdhooks.require("React")
    const getLocalizedMessage = vivaldi.jdhooks.require("_getLocalizedMessage")
    const classnames = vivaldi.jdhooks.require("classnames")
    const downloadsIcon = vivaldi.jdhooks.require("_svg_downloads_small")
    const PageActions = vivaldi.jdhooks.require("PageActions")

    const sectionName = "jddownloads"

    const findChildParentName = "__startpage_downloads_parent"
    function findChild(r, cb, recursive = false) {
        if (r && r.props && r.props.children) {
            if (!Array.isArray(r.props.children)) {
                r.props.children[findChildParentName] = r
                return cb(r.props.children)
            }

            for (let child of r.props.children) {
                child[findChildParentName] = r
                if (cb(child)) return child
                if (recursive) {
                    const inner = findChild(child, cb, recursive)
                    if (inner) return inner
                }
            }
        }
        return null
    }
    function closest(r, cb) {
        if (r) {
            if (cb(r)) return r
            if (r[findChildParentName]) return closest(r[findChildParentName], cb)
        }
        return null
    }

    return class extends cls {
        constructor(...e) {
            super(...e)

            const old_openSection = this.openSection
            this.openSection = (section, ext, event) => {
                if (section == sectionName)
                    PageActions.openURL("vivaldi://downloads", { inCurrent: true })
                else
                    old_openSection(section, ext, event)
            }
        }

        render() {
            let r = super.render()

            const history = findChild(r, c => c && c.props && c.props["data-id"] === "history", true)
            if (history) {
                let group = closest(history, c => c && c.props && c.props.className === "startpage-navigation-group")
                if (group) {
                    group.props.children.push(

                        React.createElement("button",
                            {
                                onClick: this.openSection.bind(this, sectionName, null),
                                onKeyDown: this.handleKeyDown.bind(this, sectionName),
                                onMouseDown: this.handleMouseDown,
                                title: getLocalizedMessage("Downloads"),
                                "data-id": sectionName,
                                tabIndex: history.tabIndex,
                                className: classnames({
                                    "button-startpage": true,
                                    "no-page-focus": true,
                                    active: this.props.section === sectionName
                                }),
                                dangerouslySetInnerHTML: {
                                    __html: downloadsIcon + getLocalizedMessage("Downloads")
                                }
                            }
                        )
                    )
                }
            }

            return r
        }
    }
})