// Change spacing of tree views (may need additional CSS)

vivaldi.jdhooks.addStyle(`
    :root {
        --rowHeight: 24px;
    }
    .vivaldi-tree .tree-item .tree-row label {
        line-height: var(--rowHeight);
        min-height: var(--rowHeight);
    }
`, 'treeview-spacing.js');

vivaldi.jdhooks.hookModule("vivaldiSettings", (moduleInfo, exports) => {
    let oldGetDefault = exports.getDefault;
    exports.getDefault = name => {
        switch (name) {
            case "VIVALDI_TREE_ROW_HEIGHT": return 24;
            default: return oldGetDefault(name);
        }
    }
    return exports;
});

vivaldi.jdhooks.hookClass('common_VivaldiTreeList', cls => {
    const newCls = vivaldi.jdhooks.insertWatcher(class extends cls {
        render() {
            this.props.rowHeight = this.state.jdVivaldiSettings.VIVALDI_TREE_ROW_HEIGHT;

            const sup = super.render();
            sup.props.style['--rowHeight'] = this.props.rowHeight + 'px';
            return sup;
        }
    }, { settings: ["VIVALDI_TREE_ROW_HEIGHT"] });
    return newCls;
});

// TODO: settings interface
