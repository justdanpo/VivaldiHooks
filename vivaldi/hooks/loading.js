//Tabload icon class 'progressing' with no delay. Use together with loading.css

vivaldi.jdhooks.hookClass('TabProgressIndicator', function(reactClass) {
    vivaldi.jdhooks.hookMember(reactClass, 'render', function(hookData) {
        this.state.isProgressing |= vivaldi.jdhooks.require('_NavigationState').getNavigationInfo(this.props.page).get("isLoading")
    })
});