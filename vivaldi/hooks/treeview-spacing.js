// Change spacing of tree views (may need additional CSS)

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
`, 'treeview-spacing.js');

vivaldi.jdhooks.hookModule("vivaldiSettings", (moduleInfo, exports) => {
    let oldGetDefault = exports.getDefault
    exports.getDefault = name => {
        switch (name) {
            case "VIVALDI_TREE_ROW_HEIGHT": return 24
            default: return oldGetDefault(name)
        }
    }
    return exports
})

vivaldi.jdhooks.hookClass('common_VivaldiTreeList', cls => {
    const newCls = vivaldi.jdhooks.insertWatcher(class extends cls {
        render() {
            this.props.rowHeight = this.state.jdVivaldiSettings.VIVALDI_TREE_ROW_HEIGHT

            const sup = super.render()
            sup.props.style['--rowHeight'] = this.props.rowHeight + 'px'
            return sup
        }
    }, { settings: ["VIVALDI_TREE_ROW_HEIGHT"] })
    return newCls
})

// Settings
vivaldi.jdhooks.hookClass('settings_appearance_Appearance', cls => {
    const React = vivaldi.jdhooks.require('React')
    const settings = vivaldi.jdhooks.require('vivaldiSettings')
    const settSrchCatChild = vivaldi.jdhooks.require('settings_SettingsSearchCategoryChild')

    const TreeSpacingSlider = vivaldi.jdhooks.insertWatcher(class extends React.Component {
        onValueChanged(event) {
            if (event.target && event.target.value) {
                let newVal = parseInt(event.target.value)
                settings.set({ ['VIVALDI_TREE_ROW_HEIGHT']: newVal })
            }
        }

        render() {
            const rowHeight = this.state.jdVivaldiSettings.VIVALDI_TREE_ROW_HEIGHT

            return React.createElement('div', { className: 'setting-group' },
                React.createElement('h3', null, 'Tree View Row Height'),
                React.createElement('div', { className: 'setting-single' },
                    React.createElement('input', {
                        type: 'range',
                        min: 16,
                        max: 48,
                        step: 1,
                        value: rowHeight,
                        onChange: this.onValueChanged.bind(this)
                    }),
                    React.createElement('span', null, rowHeight + 'px')))
        }
    }, { settings: ["VIVALDI_TREE_ROW_HEIGHT"] })

    class newCls extends cls {
        render() {
            let sup = super.render()

            const ts = React.createElement(TreeSpacingSlider, this.props)
            if (sup.props.children[0] && sup.props.children[0].props && sup.props.children[0].props.children)
                sup.props.children[0].props.children.push(ts)
            else
                sup.props.children.push(ts)

            return sup
        }
    }

    return newCls
})
