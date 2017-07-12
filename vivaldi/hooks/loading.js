//Tabload icon class 'progressing' with no delay. Use together with loading.css

vivaldi.jdhooks.hookModule("TabProgressIndicator", function(moduleInfo, exportsInfo) {
    vivaldi.jdhooks.hookMember(exportsInfo.exports.prototype, "render", function(hookData) {
        this.state.isProgressing |= vivaldi.jdhooks.require("_NavigationState").getNavigationInfo(this.props.page).get("isLoading")
    })
})