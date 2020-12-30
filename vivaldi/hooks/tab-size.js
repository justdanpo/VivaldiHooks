// Change the width of a tab

vivaldi.jdhooks.hookModuleExport("vivaldiSettings", "default", exports => {
    let oldGetDefault = exports.getDefault
    exports.getDefault = name => {
        switch (name) {
            case "TAB_SIZE": return {
                horizontal: {
                    unpinnedActiveWidthMax: 180,
                    unpinnedInactiveWidthMax: 180,
                    pinnedActiveWidthMax: 30,
                    pinnedInactiveWidthMax: 30,
                    pinnedAllowShrink: false
                }
            }
            default: return oldGetDefault(name)
        }
    }
    return exports
})

vivaldi.jdhooks.hookClass('tabs_TabStrip', cls => {
    return vivaldi.jdhooks.insertWatcher(class extends cls {
        getTabStyle(info, horz, focus, pin, stack, thumb) {
            let tabStyle = super.getTabStyle(...arguments)

            const tabSize = this.state.jdVivaldiSettings.TAB_SIZE
            if (horz) {
                tabStyle.maxWidth = (pin
                    ? (focus
                        ? tabSize.horizontal.pinnedActiveWidthMax
                        : tabSize.horizontal.pinnedInactiveWidthMax)
                    : (focus
                        ? tabSize.horizontal.unpinnedActiveWidthMax
                        : tabSize.horizontal.unpinnedInactiveWidthMax))
                if (pin) {
                    if (tabSize.horizontal.pinnedAllowShrink) {
                        tabStyle.flex = true
                        delete tabStyle.minWidth
                    } else {
                        tabStyle.minWidth = tabStyle.maxWidth
                    }
                }
            }

            return tabStyle
        }
    }, { settings: ['TAB_SIZE'] })
})

// Settings
vivaldi.jdhooks.hookClass('settings_tabs_TabOptions', cls => {
    const React = vivaldi.jdhooks.require('React')
    const settings = vivaldi.jdhooks.require('vivaldiSettings')

    const TabWidthSettings = vivaldi.jdhooks.insertWatcher(class extends React.Component {
        onSliderChanged(setting, event) {
            if (event.target && event.target.value) {
                let newState = this.state.jdVivaldiSettings.TAB_SIZE
                let newVal = parseInt([event.target.value])
                if (newVal > 500) newVal = 10000 // Just a really big number
                newState.horizontal = {
                    ...newState.horizontal,
                    ...{ [setting]: newVal }
                }
                settings.set({ ['TAB_SIZE']: newState })
            }
        }
        onAllowShrinkChanged(event) {
            if (event.target && event.target.checked !== null) {
                let newState = this.state.jdVivaldiSettings.TAB_SIZE
                newState.horizontal = {
                    ...newState.horizontal,
                    ...{ ['pinnedAllowShrink']: !!event.target.checked }
                }
                settings.set({ ['TAB_SIZE']: newState })
            }
        }
        createSlider(setting, label) {
            let val = this.state.jdVivaldiSettings.TAB_SIZE.horizontal[setting]
            if (val > 500) val = 510
            const displ = val > 500 ? 'Auto' : val + 'px'
            return React.createElement('div', { className: 'setting-single' },
                React.createElement('h3', null, label),
                React.createElement('input', {
                    type: 'range',
                    value: val,
                    min: 30, // Less than 30 seems to have no effect
                    max: 510,
                    step: 10,
                    onChange: this.onSliderChanged.bind(this, setting)
                }),
                React.createElement('span', null, displ))
        }
        render() {
            const tabSize = this.state.jdVivaldiSettings.TAB_SIZE
            return [
                this.createSlider('unpinnedActiveWidthMax', 'Active Tab Max Width'),
                this.createSlider('unpinnedInactiveWidthMax', 'Inactive Tab Max Width'),
                this.createSlider('pinnedActiveWidthMax', 'Active Pinned Tab Max Width'),
                this.createSlider('pinnedInactiveWidthMax', 'Pinned Tab Max Width'),
                React.createElement('div', { className: 'setting-single' },
                    React.createElement('label', null,
                        React.createElement('input', {
                            type: 'checkbox',
                            checked: tabSize.horizontal.pinnedAllowShrink,
                            onChange: this.onAllowShrinkChanged.bind(this)
                        }),
                        React.createElement('span', null, 'Allow Shrinking of Pinned Tabs')))]
        }
    }, { settings: ['TAB_SIZE'] })

    return class extends cls {
        render() {
            let sup = super.render()
            if (sup.props && sup.props.children) {
                let section = sup.props.children.find(c =>
                    c && c.props && c.props.className == 'setting-group tab-min-width')
                if (section && section.props && section.props.children) {
                    let custom = React.createElement(TabWidthSettings, this.props)
                    section.props.children.push(custom)
                }
            }
            return sup
        }
    }
})
