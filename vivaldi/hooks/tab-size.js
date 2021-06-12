// Change the width of a tab

(function(){
const defaultSettings = {
    horizontal: {
        unpinnedActiveWidthMax: 180,
        unpinnedInactiveWidthMax: 180,
        pinnedActiveWidthMax: 30,
        pinnedInactiveWidthMax: 30,
        pinnedAllowShrink: false
    },
    vertical: {
        unpinnedActiveHeightMax: 150,
        unpinnedInactiveHeightMax: 150,
        pinnedActiveHeightMax: 30,
        pinnedInactiveHeightMax: 30,
        unpinnedActiveHeightMin: 30,
        unpinnedInactiveHeightMin: 30,
        pinnedActiveHeightMin: 30,
        pinnedInactiveHeightMin: 30,
    }
}
const maxWidthLimit = 500
const maxHeightLimit = 200

function completeObject(obj, fallback = defaultSettings) {
    Object.keys(fallback).forEach(key => {
        if (!obj.hasOwnProperty(key))
            obj[key] = fallback[key]
        else if (typeof obj[key] == "object")
            obj[key] = completeObject(obj[key], fallback[key])
    })
    return obj
}

vivaldi.jdhooks.hookModuleExport("vivaldiSettings", "default", exports => {
    let oldGetDefault = exports.getDefault
    exports.getDefault = name => {
        switch (name) {
            case "TAB_SIZE": return defaultSettings
            default: return oldGetDefault(name)
        }
    }
    return exports
})

vivaldi.jdhooks.hookClass('tabs_TabStrip', cls => {
    return vivaldi.jdhooks.insertWatcher(class extends cls {
        getTabStyle(info, horz, focus, pin, stack, thumb) {
            let tabStyle = super.getTabStyle(...arguments)

            const tabSize = completeObject(this.state.jdVivaldiSettings.TAB_SIZE)
            if (horz) {
                const key = (pin ? 'pinned' : 'unpinned')
                    + (focus ? 'Active' : 'Inactive') + 'WidthMax'
                tabStyle.maxWidth = tabSize.horizontal[key]
                if (pin) {
                    if (tabSize.horizontal.pinnedAllowShrink) {
                        tabStyle.flex = true
                        delete tabStyle.minWidth
                    } else tabStyle.minWidth = tabStyle.maxWidth
                }
                if (tabStyle.maxWidth > maxWidthLimit)
                    delete tabStyle.maxWidth
            } else {
                const key = (pin ? 'pinned' : 'unpinned')
                    + (focus ? 'Active' : 'Inactive')
                tabStyle.maxHeight = tabSize.vertical[key + 'HeightMax']
                tabStyle.minHeight = tabSize.vertical[key + 'HeightMin']
                if (tabStyle.maxHeight < tabStyle.minHeight)
                    tabStyle.maxHeight = tabStyle.minHeight
                if (tabStyle.maxHeight > maxHeightLimit)
                    delete tabStyle.maxHeight
                tabStyle.flex = !tabStyle.maxHeight || (tabStyle.minHeight != tabStyle.maxHeight)
            }

            return tabStyle
        }
    }, { settings: ['TAB_SIZE'] })
})

// Settings
vivaldi.jdhooks.hookClass('settings_tabs_TabOptions', cls => {
    const React = vivaldi.jdhooks.require('React')
    const settings = vivaldi.jdhooks.require('vivaldiSettings')
    const PrefKeys = vivaldi.jdhooks.require("_PrefKeys")

    const TabWidthSettings = vivaldi.jdhooks.insertWatcher(class extends React.Component {
        onSliderChanged(dir, setting, event) {
            if (event.target && event.target.value) {
                let newState = completeObject(this.state.jdVivaldiSettings.TAB_SIZE)
                let newVal = parseInt([event.target.value])
                newState[dir] = {
                    ...newState[dir],
                    ...{ [setting]: newVal }
                }
                settings.set({ ['TAB_SIZE']: newState })
            }
        }
        onAllowShrinkChanged(event) {
            if (event.target && event.target.checked !== null) {
                let newState = completeObject(this.state.jdVivaldiSettings.TAB_SIZE)
                newState.horizontal = {
                    ...newState.horizontal,
                    ...{ ['pinnedAllowShrink']: !!event.target.checked }
                }
                settings.set({ ['TAB_SIZE']: newState })
            }
        }
        createSlider(dir, setting, label, canAuto = true) {
            let val = completeObject(this.state.jdVivaldiSettings.TAB_SIZE)[dir][setting]
            let displ = ''
            const maxLimit = (dir == 'horizontal') ? maxWidthLimit : maxHeightLimit
            if (canAuto) {
                if (val > maxLimit) val = maxLimit + 10
                displ = val > maxLimit ? 'Auto' : val + 'px'
            } else {
                val = Math.min(val, maxLimit)
                displ = val + 'px'
            }
            return React.createElement('div', { className: 'setting-single' },
                React.createElement('h3', null, label),
                React.createElement('input', {
                    type: 'range',
                    value: val,
                    min: 30, // Less than 30 seems to have no effect
                    max: canAuto ? maxLimit + 10 : maxLimit,
                    step: 10,
                    onChange: this.onSliderChanged.bind(this, dir, setting)
                }),
                React.createElement('span', null, displ))
        }
        render() {
            const tabSize = completeObject(this.state.jdVivaldiSettings.TAB_SIZE)
            const barPosition = this.state.jdPrefs[PrefKeys.kTabsBarPosition]
            if (barPosition == 'top' || barPosition == 'bottom') {
                return [
                    this.createSlider('horizontal', 'unpinnedActiveWidthMax', 'Active Tab Max Width'),
                    this.createSlider('horizontal', 'unpinnedInactiveWidthMax', 'Inactive Tab Max Width'),
                    this.createSlider('horizontal', 'pinnedActiveWidthMax', 'Active Pinned Tab Max Width'),
                    this.createSlider('horizontal', 'pinnedInactiveWidthMax', 'Pinned Tab Max Width'),
                    React.createElement('div', { className: 'setting-single' },
                        React.createElement('label', null,
                            React.createElement('input', {
                                type: 'checkbox',
                                checked: tabSize.horizontal.pinnedAllowShrink,
                                onChange: this.onAllowShrinkChanged.bind(this)
                            }),
                            React.createElement('span', null, 'Allow Shrinking of Pinned Tabs')))]
            } else {
                const ary = [];
                [true, false].forEach(isMax => {
                    const side = isMax ? 'Max' : 'Min'
                    ary.push(
                        this.createSlider('vertical', `unpinnedActiveHeight${side}`, `Active Tab ${side} Height`, isMax),
                        this.createSlider('vertical', `unpinnedInactiveHeight${side}`, `Inactive Tab ${side} Height`, isMax),
                        this.createSlider('vertical', `pinnedActiveHeight${side}`, `Active Pinned Tab ${side} Height`, isMax),
                        this.createSlider('vertical', `pinnedInactiveHeight${side}`, `Pinned Tab ${side} Height`, isMax))
                })
                return ary
            }
        }
    }, { settings: ['TAB_SIZE'], prefs: [PrefKeys.kTabsBarPosition] })

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
})()
