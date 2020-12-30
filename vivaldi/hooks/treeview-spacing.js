// Change spacing of tree views (may need additional CSS)

(function() {
vivaldi.jdhooks.addStyle(`
    :root {
        --rowHeight: 24px;
    }
    .vivaldi-tree .tree-item .tree-row label {
        line-height: var(--rowHeight);
        min-height: var(--rowHeight);
    }
    .vivaldi-settings .settings-sidebar .button-category {
        height: var(--rowHeight);
    }
    .panel#downloads {
        --rowHeight: 54px;
    }
    .panel#downloads .DownloadItem {
        --itemHeight: var(--rowHeight);
    }
`, 'treeview-spacing.js');

const spacingDetails = [
    {
        key: 'bookmarks',
        default: 24,
        label: 'Bookmarks',
        // For identification
        mimeType: 'vivaldi/x-bookmarks'
    },
    {
        key: 'downloads',
        default: 52,
        label: 'Downloads',
        // For identification
        settings: 'DOWNLOADS_TREE'
    },
    {
        key: 'history',
        default: 24,
        label: 'History',
        settings: 'HISTORY_PANEL'
    },
    {
        key: 'notes',
        default: 24,
        label: 'Notes',
        mimeType: 'vivaldi/x-notes'
    },
    {
        key: 'settingsNavigation',
        default: 28,
        label: 'Settings Navigation',
        settings: 'SETTINGS_TREE'
    },
    {
        key: 'windowPanel',
        default: 24,
        label: 'Window Panel',
        mimeType: 'vivaldi/x-window-item'
    }
]

vivaldi.jdhooks.hookModuleExport("vivaldiSettings", "default", exports => {
    let oldGetDefault = exports.getDefault
    exports.getDefault = name => {
        switch (name) {
            case "VIVALDI_TREE_ROWS_HEIGHT":
                const ret = {}
                for (let det of spacingDetails)
                    ret[det.key] = det.default
                return ret
            default: return oldGetDefault(name)
        }
    }
    return exports
})

vivaldi.jdhooks.hookClass('common_VivaldiTreeList', cls => {
    return vivaldi.jdhooks.insertWatcher(class extends cls {
        _hookRowHeight() {
            if (!this.state.jdVivaldiSettings)
                return false
            if (!this._hookedRowHeightKey) {
                const details = spacingDetails.filter(d => {
                    return ((d.hasOwnProperty('mimeType') && d.mimeType == this.props.mimeType)
                        || (d.hasOwnProperty('settings') && d.settings == this.props.settings))
                })
                if (details.length > 0) {
                    const detail = details[0]
                    this._hookedRowHeightKey = detail.key
                }
            }
            if (this._hookedRowHeightKey)
                this.props.rowHeight = this.state.jdVivaldiSettings.VIVALDI_TREE_ROWS_HEIGHT[this._hookedRowHeightKey]
        }
        constructor(...e) {
            super(...e)
            this._hookRowHeight()
        }
        render() {
            this._hookRowHeight()
            const sup = super.render()
            sup.props.style['--rowHeight'] = this.props.rowHeight + 'px'
            return sup
        }
    }, { settings: ["VIVALDI_TREE_ROWS_HEIGHT"] })
})

// Settings
vivaldi.jdhooks.hookClass('settings_appearance_Appearance', cls => {
    const React = vivaldi.jdhooks.require('React')
    const settings = vivaldi.jdhooks.require('vivaldiSettings')
    const settingsSearchCategoryChild = vivaldi.jdhooks.require('settings_SettingsSearchCategoryChild')

    const TreeSpacingSlider = vivaldi.jdhooks.insertWatcher(class extends React.Component {
        _onValueChanged(setting, event) {
            if (event.target && event.target.value) {
                let newVal = {
                    ...this.state.jdVivaldiSettings.VIVALDI_TREE_ROWS_HEIGHT,
                    ...{ [setting]: parseInt(event.target.value) }
                }
                settings.set({ ['VIVALDI_TREE_ROWS_HEIGHT']: newVal })
            }
        }

        render() {
            const rowsHeight = this.state.jdVivaldiSettings.VIVALDI_TREE_ROWS_HEIGHT
            let items = []
            let section = []
            // To avoid duplicates (menu editor)
            let usedKeys = []

            spacingDetails.forEach(det => {
                if (usedKeys.includes(det.key)) return

                usedKeys.push(det.key)
                items.push(React.createElement('div', { className: 'setting-single' },
                    React.createElement('h3', null, det.label),
                    React.createElement('input', {
                        type: 'range',
                        min: 12,
                        max: 64,
                        step: 1,
                        value: rowsHeight[det.key],
                        onChange: this._onValueChanged.bind(this, det.key)
                    }),
                    React.createElement('span', null, rowsHeight[det.key] + 'px')))
                if (items.length >= 3) {
                    section.push(React.createElement('div', { className: 'setting-group' }, ...items))
                    items = []
                }
            })
            if (items.length)
                section.push(React.createElement('div', { className: 'setting-group' }, ...items))

            return React.createElement(settingsSearchCategoryChild,
                { filter: this.props.filter },
                React.createElement('div', null,
                    React.createElement('h2', null, 'Tree Views Row Height'), ...section))
        }
    }, { settings: ["VIVALDI_TREE_ROWS_HEIGHT"] })

    return class extends cls {
        render() {
            let sup = super.render()
            const ts = React.createElement(TreeSpacingSlider, this.props)
            sup.props.children.splice(1, 0, ts)
            return sup
        }
    }
})
})()
