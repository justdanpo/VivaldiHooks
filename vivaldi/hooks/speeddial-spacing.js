// Change SD tiles geometry (spacing etc.)

vivaldi.jdhooks.hookModuleExport("vivaldiSettings", "default", exports => {
    let oldGetDefault = exports.getDefault
    exports.getDefault = name => {
        switch (name) {
            case "SPEEDDIAL_SIZING": return {
                widthHeightRatio: 1.2,
                spacing: 5,
                edgeMargin: 15
            }
            default: return oldGetDefault(name)
        }
    }
    return exports
})

vivaldi.jdhooks.hookClass('speeddial_SpeedDialView', cls => {
    const PrefKeys = vivaldi.jdhooks.require('_PrefKeys')

    return vivaldi.jdhooks.insertWatcher(class extends cls {
        constructor(...e) {
            super(...e)

            this.getSpeedDialGeometry = () => {
                const sets = this.state.jdVivaldiSettings.SPEEDDIAL_SIZING

                let width = this.props.prefValues[PrefKeys.kStartpageSpeedDialWidth]
                // Adjust size automatically
                if (width === -1) {
                    const wth = Math.round(this.props.maxWidth / (1.0 * this.props.prefValues[PrefKeys.kStartpageSpeedDialColumns]))
                    width = Math.max(Math.min(wth, 400), 100)
                }
                const height = Math.round(width / sets.widthHeightRatio)
                const spacing = sets.spacing

                let count = this.state.dialNodes.length
                // One more for the "plus" tile
                if (this.props.prefValues[PrefKeys.kStartpageSpeedDialAddButtonVisible]) count++

                const spacedWidth = width + 2 * spacing

                let spacedHeight = height + 2 * spacing
                let bgHeight = height
                // Add space for titles
                const showTitle = this.props.prefValues[PrefKeys.kStartpageSpeedDialTitlesVisible]
                if (showTitle === "always") {
                    spacedHeight += 32
                    bgHeight += 32
                }

                const margin = sets.edgeMargin
                const maxCols = this.props.prefValues[PrefKeys.kStartpageSpeedDialColumns] || 1000

                let cols = Math.max(
                    1,
                    Math.min(
                        Math.floor(
                            (this.props.maxWidth - margin)
                            / spacedWidth),
                        maxCols))
                if (this.props.maxWidth < (spacedWidth * cols + margin))
                    cols = 1

                return {
                    backgroundWidth: width,
                    backgroundHeight: bgHeight,
                    count: count,
                    cols: cols,
                    rows: Math.ceil(count / cols),
                    dialWidth: spacedWidth,
                    dialHeight: spacedHeight,
                    thumbnailWidth: width,
                    thumbnailHeight: height,
                    dialSpace: spacing
                }
            }
        }
    }, { settings: ["SPEEDDIAL_SIZING"] })
})

// Settings
vivaldi.jdhooks.hookClass('settings_startpage_StartPage', cls => {
    const React = vivaldi.jdhooks.require('React')
    const settings = vivaldi.jdhooks.require('vivaldiSettings')
    const settSrchCatChild = vivaldi.jdhooks.require('settings_SettingsSearchCategoryChild')
    const PrefKeys = vivaldi.jdhooks.require('_PrefKeys')
    const PrefSet = vivaldi.jdhooks.require('_PrefSet')

    const TilesSection = vivaldi.jdhooks.insertWatcher(class extends React.Component {
        onInputChanged(setting, parseFunction, event) {
            if (event.target && event.target.value) {
                let newState = { ... this.state.jdVivaldiSettings.SPEEDDIAL_SIZING, ...{ [setting]: parseFunction([event.target.value]) } }
                settings.set({ ['SPEEDDIAL_SIZING']: newState })
            }
        }

        onWidthInputChanged(event) {
            if (event.target && event.target.value) {
                let val = parseInt(event.target.value)
                if (val < 100) val = -1
                PrefSet.set(PrefKeys.kStartpageSpeedDialWidth, val)
            }
        }

        onMaxColsInputChanged(event) {
            if (event.target && event.target.value) {
                let val = parseInt(event.target.value)
                if (val < 1) val = 1000
                PrefSet.set(PrefKeys.kStartpageSpeedDialColumns, val)
            }
        }

        render() {
            const sets = this.state.jdVivaldiSettings.SPEEDDIAL_SIZING

            let tileWidth = this.props.prefValues[PrefKeys.kStartpageSpeedDialWidth]
            let tileDisplayWidth = tileWidth + 'px'
            if (tileWidth < 100) {
                tileWidth = 90
                tileDisplayWidth = 'Auto'
            }
            let maxCols = this.props.prefValues[PrefKeys.kStartpageSpeedDialColumns]
            let maxColsDisplay = maxCols
            if (maxCols > 20) {
                maxCols = 0
                maxColsDisplay = 'Auto'
            }
            return React.createElement(settSrchCatChild,
                { filter: this.props.filter },
                React.createElement('div', { className: 'setting-single' },
                    React.createElement('h3', null, 'Maximum Columns'),
                    React.createElement('input', {
                        type: 'range',
                        min: 0,
                        max: 20,
                        step: 1,
                        value: maxCols,
                        onChange: this.onMaxColsInputChanged.bind(this)
                    }),
                    React.createElement('span', null, maxColsDisplay)),
                React.createElement('div', { className: 'setting-single pad-top' },
                    React.createElement('h3', null, 'Width of Tiles'),
                    React.createElement('input', {
                        type: 'range',
                        min: 90,
                        max: 400,
                        step: 10,
                        value: tileWidth,
                        onChange: this.onWidthInputChanged.bind(this)
                    }),
                    React.createElement('span', null, tileDisplayWidth)),
                React.createElement('div', { className: 'setting-single pad-top' },
                    React.createElement('h3', null, 'Width to Height Ratio'),
                    React.createElement('input', {
                        type: 'range',
                        min: 0.5,
                        max: 2,
                        step: 0.1,
                        value: sets.widthHeightRatio,
                        onChange: this.onInputChanged.bind(this, 'widthHeightRatio', parseFloat)
                    }),
                    React.createElement('span', null, sets.widthHeightRatio)),
                React.createElement('div', { className: 'setting-single pad-top' },
                    React.createElement('h3', null, 'Spacing between Tiles'),
                    React.createElement('input', {
                        type: 'range',
                        min: 0,
                        max: 100,
                        step: 1,
                        value: sets.spacing,
                        onChange: this.onInputChanged.bind(this, 'spacing', parseInt)
                    }),
                    React.createElement('span', null, sets.spacing + 'px')),
                React.createElement('div', { className: 'setting-single pad-top' },
                    React.createElement('h3', null, 'Margin on the Sides'),
                    React.createElement('input', {
                        type: 'range',
                        min: 0,
                        max: 200,
                        step: 5,
                        value: sets.edgeMargin,
                        onChange: this.onInputChanged.bind(this, 'edgeMargin', parseInt)
                    }),
                    React.createElement('span', null, sets.edgeMargin + 'px'))
            )
        }
    }, { settings: ["SPEEDDIAL_SIZING"] })

    const findChildParentName = "__spacing_parent"
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

    const isMaxColumns = c => c && c.props && c.props.className == "max-columns"
    const isSettingGroup = c => c && c.props && c.props.className == "setting-group"

    class newCls extends cls {
        render() {
            let sp = super.render()

            const maxcol = findChild(sp, isMaxColumns, true)
            if (maxcol) {
                let group = closest(maxcol, isSettingGroup)
                if (group && group.props && group.props.children) {
                    for (const groupItemIdx in group.props.children) {
                        if (findChild(group.props.children[groupItemIdx], isMaxColumns, true))
                            group.props.children[groupItemIdx] = null
                    }
                    let newOptions = React.createElement(TilesSection, this.props)
                    group.props.children.unshift(newOptions)
                }
            }

            return sp
        }
    }
    return newCls
})
