// Small pinned tabs in vertical tab bar

vivaldi.jdhooks.hookModule('yoga-layout', (modInfo, exports) => {
    // If it didn't return the yogised layout, normally you'd hook
    // tabs_TabStrip.createFlexBoxLayout
    return function(layout, ...e) {
        // See https://yogalayout.com/playground/ (or just the root URL)
        // to get a better understanding of some of the properties

        // Yoga is used only for the tab bar, but anyway check it
        if (layout.children && layout.children.some(t => t.type === "tab")
            && layout.style.flexDirection === "column") { // It's vertical
            let lastPinned = -1, // They should come first but just in case
                thisRowWidth = 0,
                fromTop = 0
            layout.children = layout.children.reduce((ary, elm) => {
                if (elm.type !== "tab"
                    // Isn't pinned
                    || !(elm.tab.page && elm.tab.page.pinned)
                    // Is stacked, but this is the normal display in 2nd tab bar
                    || (elm.tab.page.getIn(["extData", "group"]) && elm.tab.get("type") === "tab")) {
                    ary.push(elm)
                    return ary
                }
                // It's a pinned tab
                if ((thisRowWidth + 30) > layout.style.width) {
                    fromTop += 30
                    thisRowWidth = 0
                }
                elm.style = {
                    ...elm.style,
                    ...{
                        position: "absolute",
                        left: thisRowWidth,
                        top: fromTop,
                        flex: false,
                        width: 30,
                        minWidth: 30,
                        maxWidth: 30,
                        height: 30,
                        minHeight: 30,
                        maxHeight: 30
                    }
                }
                thisRowWidth += 30
                // Make sure that it's before non-pinned tabs
                ary.splice(lastPinned + 1, 0, elm)
                lastPinned++
                return ary
            }, [])

            if (lastPinned > -1) {
                // Add a spacer so that normal tabs don't cover pinned
                layout.children.splice(lastPinned + 1, 0, {
                    type: "blank",
                    style: {
                        flex: false,
                        height: fromTop + 30,
                        minHeight: fromTop + 30,
                        maxHeight: fromTop + 30
                    },
                    tab: {} // Don't crash/error pls
                })
            }
        }
        return exports(layout, ...e)
    }
})
