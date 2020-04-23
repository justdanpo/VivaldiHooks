//Move Minimize/Zoom/Close buttons to addressbar when Vivaldi is maximized and tab position is NOT "Top"

vivaldi.jdhooks.addStyle(`
#browser:not(.native):not(.horizontal-menu):not(.tabs-top).maximized #header { display: none; }

#browser.horizontal-menu .MaximizedWindowButtons,
#browser.tabs-top .MaximizedWindowButtons,
#browser:not(.maximized) .MaximizedWindowButtons,
#browser.native .MaximizedWindowButtons { display: none }

.MaximizedWindowButtons.window-buttongroup {
    position: relative !important;
    align-self: baseline;
}

#vivaldi-button-moved {
    order: -1;
}



/* copypasted from common.css, "#header #titlebar .window-buttongroup" replaced with ".MaximizedWindowButtons" */

#browser.win.win10 .MaximizedWindowButtons button.window-close {
  background-color: transparent;
  fill: var(--colorImageForeground, inherit);
}

#browser.win.win10 .MaximizedWindowButtons {
  overflow: hidden;
  line-height: initial;
}
#browser.win.win10 .MaximizedWindowButtons button.window-minimize svg {
  margin: auto;
}

.tabs-right#browser.win.win10 .MaximizedWindowButtons button.window-close,
.tabs-left#browser.win.win10 .MaximizedWindowButtons button.window-close,
.tabs-bottom#browser.win.win10 .MaximizedWindowButtons button.window-close {
  fill: var(--colorFg, var(--colorImageForeground));
}
.color-behind-tabs-off.tabs-right#browser.win.win10 .MaximizedWindowButtons button.window-close,
.color-behind-tabs-off.tabs-left#browser.win.win10 .MaximizedWindowButtons button.window-close,
.color-behind-tabs-off.tabs-bottom#browser.win.win10 .MaximizedWindowButtons button.window-close {
  fill: var(--colorAccentFg, var(--colorImageForeground));
}
#browser.win.win10 .MaximizedWindowButtons button.window-close:hover {
  fill: #fff;
  background-color: #e3423e;
}
#browser.win.win10 .MaximizedWindowButtons button:hover {
  fill: var(--colorImageForeground, inherit);
}

.tabs-right#browser.win.win10 .tabs-bottom#browser.win.win10 .tabs-left#browser.win.win10,
#browser.win.win10 .MaximizedWindowButtons button {
  height: 25px;
}
`, "move-window-buttons-maximized.js")

vivaldi.jdhooks.hookClass("urlfield_UrlBar", oldClass => {
    const React = vivaldi.jdhooks.require("React")
    const ShowMenu = vivaldi.jdhooks.require("_ShowMenu")
    const CommandManager = vivaldi.jdhooks.require("_CommandManager")

    class newClass extends oldClass {
        constructor(...e) { super(...e) }

        vivaldiButtonClick(event) {
            const rect = event.target.getBoundingClientRect()
            const props = {
                id: 0,
                rect: {
                    x: parseInt(rect.left),
                    y: parseInt(rect.top),
                    width: parseInt(rect.width),
                    height: parseInt(rect.height)
                },
                menu: {
                    items:
                        //TODO: remove condition later
                        CommandManager.getVerticalMenu ? CommandManager.getVerticalMenu() : CommandManager.getNamedMenu("vivaldi", true)
                }
            }
            ShowMenu.show(props.id, [props], "bottom")
        }

        render() {
            let ret = super.render()

            let iconClose, iconMinimize, iconZoom;

            const platform = window.navigator.platform.indexOf("Linux") >= 0 ?
                "linux" :
                navigator.platform.indexOf("MacIntel") >= 0 ?
                    "mac" :
                    window.navigator.appVersion.indexOf("Windows NT 10") >= 0 ?
                        "win10" :
                        "win"

            switch (platform) {
                case "linux":
                case "win":
                    iconClose = vivaldi.jdhooks.require("_svg_window_close")
                    iconMinimize = vivaldi.jdhooks.require("_svg_window_minimize")
                    iconZoom = vivaldi.jdhooks.require("_svg_window_zoom")
                    break;
                case "win10":
                    iconClose = vivaldi.jdhooks.require("_svg_window_close_win10")
                    iconMinimize = vivaldi.jdhooks.require("_svg_window_minimize_win10")
                    iconZoom = vivaldi.jdhooks.require("_svg_window_zoom_win10")
                    break;
                case "mac":
                    iconClose = vivaldi.jdhooks.require("_svg_window_close_mac")
                    iconMinimize = vivaldi.jdhooks.require("_svg_window_minimize_mac")
                    iconZoom = vivaldi.jdhooks.require("_svg_window_zoom_mac")
            }

            function createButton(className, image) {
                return React.createElement("button", {
                    tabIndex: "-1",
                    className: "MaximizedWindowButtons " + className,
                    style: {
                        order: 255
                    },
                    onClick: function () {
                        document.querySelector(`#browser > #header > #titlebar .${className}`).click()
                    },
                    dangerouslySetInnerHTML: {
                        __html: image
                    }
                })
            }

            ret.props.children.push(
                React.createElement("div", {
                    className: "toolbar toolbar-mainbar MaximizedWindowButtons",
                    id: "vivaldi-button-moved"
                },
                    React.createElement("div", { className: "button-toolbar" },
                        React.createElement("button", {
                            tabIndex: "-1",
                            dangerouslySetInnerHTML: {
                                __html: vivaldi.jdhooks.require("_svg_menu_vivaldi")
                            },
                            onClick: this.vivaldiButtonClick.bind(this)
                        }))
                ))

            ret.props.children.push(
                React.createElement("div", { className: "MaximizedWindowButtons window-buttongroup" },
                    createButton("window-minimize", iconMinimize),
                    createButton("window-maximize", iconZoom),
                    createButton("window-close", iconClose)
                )
            )

            return ret
        }
    }

    return newClass
})
