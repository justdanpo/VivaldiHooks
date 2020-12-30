// Window panel actions on tab switch

vivaldi.jdhooks.hookModuleExport('vivaldiSettings', 'default', exports => {
    let oldGetDefault = exports.getDefault
    exports.getDefault = name => {
        switch (name) {
            case 'WINDOW_PANEL_TAB_SWITCHED_ACTIONS': return {
                expandToActive: true,
                selectActive: true
            }
            default: return oldGetDefault(name)
        }
    }
    return exports
})

vivaldi.jdhooks.hookClass('tabs_WindowTree', cls => {
    const PageStore = vivaldi.jdhooks.require('_PageStore')
    return vivaldi.jdhooks.insertWatcher(class extends cls {
        constructor(...e) {
            super(...e)

            let old_onPageStoreChanged = this._onPageStoreChanged
            this._onPageStoreChanged = () => {
                old_onPageStoreChanged()
                const e = PageStore.getActivePage()
                const sets = this.state.jdVivaldiSettings.WINDOW_PANEL_TAB_SWITCHED_ACTIONS
                // Expand tree to active tab
                if (sets.expandToActive)
                    this.refTreeList.current.expandToId(e.id)
                // Change selection to active tab
                if (sets.selectActive)
                    this.refTreeList.current.selectById(e.id)
            }
        }
    }, { settings: ['WINDOW_PANEL_TAB_SWITCHED_ACTIONS'] })
})

// Settings
vivaldi.jdhooks.hookClass('settings_panel_Panel', cls => {
    const React = vivaldi.jdhooks.require('React')
    const settings = vivaldi.jdhooks.require('vivaldiSettings')
    const settingsSearchCategoryChild = vivaldi.jdhooks.require('settings_SettingsSearchCategoryChild')

    const WPSettings = vivaldi.jdhooks.insertWatcher(class extends React.Component {
        _onCheckBoxChanged(setting, event) {
            if (event.target && event.target.checked !== null) {
                let newState = {
                    ...this.state.jdVivaldiSettings.WINDOW_PANEL_TAB_SWITCHED_ACTIONS,
                    ...{ [setting]: !!event.target.checked }
                }
                settings.set({ ['WINDOW_PANEL_TAB_SWITCHED_ACTIONS']: newState })
            }
        }
        _createCheckBox(setting, label) {
            const val = this.state.jdVivaldiSettings.WINDOW_PANEL_TAB_SWITCHED_ACTIONS[setting]
            return React.createElement('div', { className: 'setting-single' },
                React.createElement('label', null,
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: val,
                        onChange: this._onCheckBoxChanged.bind(this, setting)
                    }),
                    React.createElement('span', null, label)))
        }
        render() {
            return React.createElement(settingsSearchCategoryChild,
                { filter: this.props.filter },
                React.createElement('div', { className: 'setting-group' },
                    React.createElement('h3', null, 'Window Panel Actions on Tab Switch'),
                    this._createCheckBox('expandToActive', 'Expand Tree to Active Tab'),
                    this._createCheckBox('selectActive', 'Select Active Tab')))
        }
    }, { settings: ['WINDOW_PANEL_TAB_SWITCHED_ACTIONS'] })

    return class extends cls {
        render() {
            let sup = super.render();
            if (sup.props && sup.props.children) {
                let wp = React.createElement(WPSettings, this.props)
                sup.props.children.push(wp)
            }
            return sup
        }
    }
})
