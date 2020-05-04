//Close Tab button in Quick Commands

vivaldi.jdhooks.addStyle(`
	.quick-command:not([data-selected]) .quick-command-close-tab { display: none }
	.quick-command[data-selected] .quick-command-close-tab { background-color: rgba(0, 0, 0, .15)}
`, "qc-close-tab.js")

vivaldi.jdhooks.hookClass("quickCommands_QuickCommandSearch", cls => {
	const PageActions = vivaldi.jdhooks.require("PageActions")

	class qc extends cls {

		jdUpdateTabs() {
			for (let idx in this.state.renderedArray) {
				let item = this.state.renderedArray[idx]
				if (item.type === "openTab") item.jdOnTabClose = () => {
					PageActions.closePage(item.command)
					this.openTabsInAllWindows = this.openTabsInAllWindows.filter(x => x.id != item.id)
					this.searchChange(this.state.quickCommandSearchValue, 0)
				}
			}
		}

		constructor(...e) {
			super(...e)
			this.jdUpdateTabs()
		}

		componentDidUpdate(prevProps, prevState, snapshot) { this.jdUpdateTabs() }
	}
	return qc
})

vivaldi.jdhooks.hookClass("quickCommands_CommandItem", cls => {
	const React = vivaldi.jdhooks.require("React")
	const getLocalizedMessage = vivaldi.jdhooks.require("_getLocalizedMessage")

	class qcItem extends cls {
		constructor(...e) { super(...e) }

		render() {
			let r = super.render()

			if (this.props.item.type == "openTab") {
				r.props.children.push(
					React.createElement("span", {
						className: "quick-command-close-tab",
						title: getLocalizedMessage("Close Tab"),
						dangerouslySetInnerHTML: { __html: vivaldi.jdhooks.require("_svg_btn_delete") },
						onClick: (e => {
							e.stopPropagation()

							if (this.props.item.jdOnTabClose) this.props.item.jdOnTabClose()
						}).bind(this)
					})
				)
			}

			return r
		}
	}
	return qcItem
})
