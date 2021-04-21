//Move Minimize/Zoom/Close buttons to addressbar when Vivaldi is maximized and tab position is NOT "Top"

(function () {

    vivaldi.jdhooks.addStyle(`
#browser:not(.popup):not(.horizontal-menu):not(.tabs-top).maximized #header,
#browser:not(.popup):not(.horizontal-menu):not(.tabs-top).native #header { display: none; }

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
    display: none;
}

#browser:not(.horizontal-menu):not(.tabs-top).maximized #vivaldi-button-moved,
#browser:not(.horizontal-menu):not(.tabs-top).native #vivaldi-button-moved {
    display: initial;
    flex: 0;
    padding-right: 34px;
}

.toolbar-mailbar {
    --ToolbarItemGap: 4px;
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
#browser.win.win10 .MaximizedWindowButtons.window-buttongroup button {
  height: 25px;
}
`, "move-window-buttons-maximized.js")

function hookFunction(oldClass) {
    const React = vivaldi.jdhooks.require("React")
    const ShowMenu = vivaldi.jdhooks.require("_ShowMenu")
    const CommandManager = vivaldi.jdhooks.require("_CommandManager")
    const ToolbarButton = vivaldi.jdhooks.require("toolbars_ToolbarButton")

    class newClass extends oldClass {
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
                    items: CommandManager.getNamedMenu("vivaldi", true),
                    expandId: "",
                    preferred: []
                }
            }
            ShowMenu.show(props.id, [props], "bottom")
        }

        render() {
            let ret = super.render()

            let iconClose, iconMinimize, iconZoom

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
                    break
                case "win10":
                    iconClose = vivaldi.jdhooks.require("_svg_window_close_win10")
                    iconMinimize = vivaldi.jdhooks.require("_svg_window_minimize_win10")
                    iconZoom = vivaldi.jdhooks.require("_svg_window_zoom_win10")
                    break
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
                    className: "toolbar toolbar-mainbar",
                    id: "vivaldi-button-moved"
                },
                    React.createElement(ToolbarButton, {
                        tooltip: "Menu",
                        onClick: this.vivaldiButtonClick.bind(this),
                        image: vivaldi.jdhooks.require("_svg_menu_vivaldi")
                    })
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
}

vivaldi.jdhooks.hookClass("urlfield_UrlBar", hookFunction)
vivaldi.jdhooks.hookClass("mail_MailBar", hookFunction)

})()
