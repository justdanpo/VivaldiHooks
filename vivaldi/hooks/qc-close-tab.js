//Close Tab button in Quick Commands

vivaldi.jdhooks.addStyle(`
	.quick-command:not([data-selected]) .quick-command-close-tab { display: none }
	.quick-command[data-selected] .quick-command-close-tab { background-color: rgba(0, 0, 0, .15)}
`, "qc-close-tab.js")

vivaldi.jdhooks.hookClass("quickCommands_QuickCommandSearch", cls => {
	const PageActions = vivaldi.jdhooks.require("PageActions")
	const PageStore = vivaldi.jdhooks.require("_PageStore")

	class qc extends cls {

		jdUpdateTabs() {
			for (let idx in this.state.renderedArray) {
				let item = this.state.renderedArray[idx]
				if (item.type === "openTab") item.jdOnTabClose = () => {
					PageActions.closePage(PageStore.getPageById(item.pageId))
					this.openTabsInAllWindows = this.openTabsInAllWindows.filter(x => x.id != item.pageId)
					this.searchChange(this.state.quickCommandSearchValue, 0)
				}
			}
		}

		constructor(...e) {
			super(...e)
			this.jdUpdateTabs()

			this.qcInitialFocus = document.activeElement
			this.qcFocusLost = false

			const old_onKeyDown = this.onKeyDown
			this.onKeyDown = (e => {
				if (e.shiftKey && e.key == "Delete") {
					const item = this.state.renderedArray[this.qclist.getSelectedIndex()]
					if (item.jdOnTabClose) item.jdOnTabClose()
					e.preventDefault()
					e.stopPropagation()
					return
				}
				return old_onKeyDown(e)
			})

			this.qcCloseSetFocusBack = (evt => {
				this.qcFocusLost = true
				evt.target.focus()
			}).bind(this)
		}

		componentDidMount() {
			if (super.componentDidMount) { super.componentDidMount() }
			(this.refs.quickCommand || this.refs.quickCommandHint).addEventListener("blur", this.qcCloseSetFocusBack)
		}

		componentWillUnmount() {
			(this.refs.quickCommand || this.refs.quickCommandHint).removeEventListener("blur", this.qcCloseSetFocusBack)
			if (super.componentWillUnmount) super.componentWillUnmount()

			if (this.qcFocusLost) {
				if (document.body.contains(this.qcInitialFocus)) {
					this.qcInitialFocus.focus()
				} else {
					const activeWebView = document.querySelector(".active.webpageview webview")
					if (activeWebView) activeWebView.focus()
				}
			}
		}

		componentDidUpdate(prevProps, prevState, snapshot) {
			if (super.componentDidUpdate) super.componentDidUpdate(prevProps, prevState, snapshot)
			this.jdUpdateTabs()
		}
	}
	return qc
})

vivaldi.jdhooks.hookClass("quickCommands_CommandItem", cls => {
	const React = vivaldi.jdhooks.require("React")
	const getLocalizedMessage = vivaldi.jdhooks.require("_getLocalizedMessage")

	class qcItem extends cls {
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
