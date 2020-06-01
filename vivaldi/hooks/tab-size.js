// Change the width of a tab

vivaldi.jdhooks.hookModule("vivaldiSettings", (moduleInfo, exports) => {
    let oldGetDefault = exports.getDefault
    exports.getDefault = name => {
        switch (name) {
            case "TAB_SIZE": return {
                horizontal: {
                    unpinnedActiveWidthMax: 180,
                    unpinnedInactiveWidthMax: 180,
                    pinnedActiveWidthMax: 31,
                    pinnedInactiveWidthMax: 31,
                    pinnedAllowShrink: false
                }
            }
            default: return oldGetDefault(name)
        }
    }
    return exports
})

vivaldi.jdhooks.hookClass('tabs_TabStrip', cls => {
    const newCls = vivaldi.jdhooks.insertWatcher(class extends cls {
        getTabStyle(info, horz, focus, pin, stack, thumb) {
            let tabStyle = super.getTabStyle(...arguments);

            const tabSize = this.state.jdVivaldiSettings.TAB_SIZE;
            if (horz) {
                tabStyle.maxWidth = (pin
                    ? (focus
                        ? tabSize.horizontal.pinnedActiveWidthMax
                        : tabSize.horizontal.pinnedInactiveWidthMax)
                    : (focus
                        ? tabSize.horizontal.unpinnedActiveWidthMax
                        : tabSize.horizontal.unpinnedInactiveWidthMax));
                if (pin)
                    tabStyle.flex = tabSize.horizontal.pinnedAllowShrink;
            }

            return tabStyle;
        }
    }, { settings: ['TAB_SIZE'] });
    return newCls;
});
