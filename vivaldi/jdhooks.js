//var result = vivaldi.jdhooks.require(moduleName)
//vivaldi.jdhooks.hookClass(className, class => newClass, ?{settings:[], pregs:[]})
//vivaldi.jdhooks.hookMember(object, memberName, function cbBefore(hookData, {oldarglist}), function cbAfter(hookData, {oldarglist}))
//vivaldi.jdhooks.hookModule(moduleName, (moduleInfo, exports) => newExports)
//vivaldi.jdhooks.onUIReady(function())
//vivaldi.jdhooks.addStyle(style)

(function () {
    const jdhooks_module_index = 'jdhooks_module'
    const jdhooks_ui_ready_event = 'jdhooks.uiready'

    const fastProcessModules = true

    let jdhooks = vivaldi.jdhooks = { _hooks: {}, _hookDescriptions: {}, _moduleMap: {}, _moduleNames: {} }

    //---------------------------------------------------------------------
    //API

    //addStyle(style)
    vivaldi.jdhooks.addStyle = (style, description) => {
        let s = document.createElement("style")
        s.innerHTML = style
        if (description) s.setAttribute("description", description)
        document.head.appendChild(s)
    }

    //hookModule(moduleName, function(moduleInfo))
    const hookModule = vivaldi.jdhooks.hookModule = (moduleName, newfn) => {
        const moduleIndex = vivaldi.jdhooks._moduleMap[moduleName]
        const oldfn = vivaldi.jdhooks._modules[moduleIndex]
        vivaldi.jdhooks._modules[moduleIndex] = (moduleInfo, exports, nrequire) => {
            oldfn(moduleInfo, exports, nrequire)

            if (moduleInfo.exports.hasOwnProperty("a")) {
                moduleInfo.exports = { ...moduleInfo.exports, ...{ a: newfn(moduleInfo, moduleInfo.exports.a) } }
            }
            else if (moduleInfo.exports.hasOwnProperty("default")) {
                moduleInfo.exports = { ...moduleInfo.exports, ...{ default: newfn(moduleInfo, moduleInfo.exports.default) } }
            }
            else {
                moduleInfo.exports = newfn(moduleInfo, moduleInfo.exports)
            }

            return moduleInfo.exports
        }
    }

    //hookClass(className, function(class))
    let hookClassList = {}
    jdhooks._unusedClassHooks = {} //stats
    let hookClassPrefs = {}
    let hookClassSettings = {}

    const hookClass = vivaldi.jdhooks.hookClass = (className, cb, p) => {
        hookClassList[className] = hookClassList[className] || []
        hookClassList[className].push(cb)
        if (p && p.prefs) hookClassPrefs[className] = (hookClassPrefs[className] || []).concat(p.prefs)
        if (p && p.settings) hookClassSettings[className] = (hookClassSettings[className] || []).concat(p.settings)
        vivaldi.jdhooks._unusedClassHooks[className] = true
    }

    //hookMember(object, memberName, function(hookData,oldarglist), function(hookData,oldarglist))
    const hookMember = vivaldi.jdhooks.hookMember = function (obj, memberName, cbBefore = null, cbAfter = null) {
        if (!obj.hasOwnProperty(memberName))
            throw "jdhooks.hookMember: wrong member name " + memberName

        return {
            ...obj, ...{
                [memberName]: () => {

                    let abortHook = false
                    let hookData = {
                        arguments: arguments,
                        abort: () => { abortHook = true }
                    }

                    let args = [].slice.call(hookData.arguments, 0);
                    [].unshift.call(args, hookData)

                    if (cbBefore)
                        hookData.retValue = cbBefore.apply(this, args)

                    if (abortHook)
                        return hookData.retValue

                    hookData.retValue = obj[memberName].apply(this, hookData.arguments)

                    if (cbAfter)
                        hookData.retValue = cbAfter.apply(this, args)

                    return hookData.retValue
                }
            }
        }
    }

    //onUIReady(function)
    vivaldi.jdhooks.onUIReady = _ => document.addEventListener(jdhooks_ui_ready_event, _)

    //---------------------------------------------------------------------

    function loadHooks(callback) {
        chrome.runtime.getPackageDirectoryEntry(_ => _.createReader().readEntries(outerDirItems => {
            let pendingscripts = {}

            function checkFinished() {
                if (0 === Object.keys(pendingscripts).length) {
                    //all scripts are a loaded
                    callback()
                }
            }

            function getDescription(fileEntry) {
                fileEntry.file(file => {
                    let reader = new FileReader();
                    reader.onloadend = function (e) {
                        const parsed = /^[\x00-\x20]*?(\/\*\s*([\s\S\w]*?)\*\/)|(\/\/\s*(.*))/gm.exec(reader.result)
                        if (parsed) {
                            const desc = parsed[2] || parsed[4]
                            vivaldi.jdhooks._hookDescriptions[fileEntry.name] = desc
                        }
                    }
                    reader.readAsText(file)
                }, () => { })
            }

            let hooksItem = outerDirItems.find(_ => _.isDirectory && _.name == "hooks")

            if (!hooksItem) {
                checkFinished()
            } else
                hooksItem.createReader().readEntries(dirItems => {

                    chrome.storage.local.get("JDHOOKS_STARTUP", function (cfg) {
                        cfg = { ...{ JDHOOKS_STARTUP: { defaultLoad: true, scripts: {} } }, ...cfg }

                        for (const i in dirItems) {
                            let dirItem = dirItems[i]

                            let fileExt = dirItem.name.split('.').pop().toUpperCase()

                            if ((fileExt !== "JS") && (fileExt !== "CSS"))
                                continue

                            let shouldBeLoaded = undefined === cfg.JDHOOKS_STARTUP.scripts[dirItem.name] ? cfg.JDHOOKS_STARTUP.defaultLoad : cfg.JDHOOKS_STARTUP.scripts[dirItem.name]
                            if (dirItem.name === "jdhooks-startup-settings.js") shouldBeLoaded = true

                            getDescription(dirItem)

                            vivaldi.jdhooks._hooks[dirItem.name] = shouldBeLoaded

                            if (!shouldBeLoaded)
                                continue

                            let Elem
                            if (fileExt === "JS") {

                                Elem = document.createElement("script")
                                Elem.src = "hooks/" + dirItem.name
                                pendingscripts[Elem.src] = true

                                Elem.onload = function (e) {
                                    delete pendingscripts[this.src]
                                    checkFinished()
                                }
                            }

                            if (fileExt === "CSS") {

                                Elem = document.createElement("link")
                                Elem.href = "hooks/" + dirItem.name
                                Elem.rel = "stylesheet"

                            }

                            document.head.appendChild(Elem)
                        }
                        checkFinished()
                    }) //storage get
                })
        })) //getPackageDirectoryEntry
    }

    //---------------------------------------------------------------------
    let classNameCache = jdhooks._dbg_classNameCache = {}

    function makeSignatures() {
        let jsxNames = {
            "NativeResizeObserver": "vivaldi/NativeResizeObserver.js",
        }

        let moduleSignatures = {
            "autolinker": [".Autolinker", "`splitRegex` must have the 'g' flag set"],
            "buffer": ["The buffer module from node.js, for the browser"],
            "chroma.js": ["chroma.js"],
            "classnames": ["jedwatson.github.io/classnames"],
            "highlight.js": ["initHighlightingOnLoad", "highlight|plain|text"],
            "lodash": ['"lodash"', "filter|find|map|reject"],
            "moment.js": ["use moment.updateLocale"],
            "Object.Assign": ["Object.assign cannot be called with null or undefined"],
            "process": ["process.binding is not supported"],
            "punycode": ['"Overflow: input needs wider integers to process",'],
            "react-css-transition-replace": ["string refs are not supported on children of ReactCSSTransitionReplace"],
            "react-motion": ["startAnimationIfNecessary", "lastIdealVelocity"],
            "react-virtualized": ["ReactVirtualized__Grid", "__reactInternalSnapshotFlag"],
            "React": ["react.production."],
            "ReactDOM": ["react-dom.production."],
            "scheduler": ["scheduler.production."],
            "setProgressState": ["setProgressState", '"PAGE_SET_PROGRESS"'],
            "url": [".prototype.parseHost"],
            "velocity.js": ["VelocityJS.org"],
            "yoga-layout": ["computeLayout:", "fillNodes:"],
            //"rrule.js": ["rrule.js"],
            //"react-mosaic": ["MosaicActionsPropType", "Palantir Technologies"],

            "_ActionList_DataTemplate": ["CHROME_SET_SESSION:", "CHROME_TABS_API:"],
            "_ActionManager": ["commandChanged", "restoreCommandGestures", "executeActions"],
            "_BookmarkBarActions": ["Error removing bookmark tree:"],
            "_BookmarkStore": ["validateAsBookmarkBarFolder"],
            "_CommandManager": ['emitChange("shortcut")'],
            "_decodeDisplayURL": [".removeTrailingSlashWhenNoPath(", ".getDisplayUrl(", "decodeURI("],
            "_getLocalizedMessage": [".i18n.getMessage"],
            "_getPrintableKeyName": ['"BrowserForward"', '"PrintScreen"'],
            "_KeyCodes": ["KEY_CANCEL:"],
            "_MouseGesturesHandler": ["onMouseGestureDetection.addListener"],
            "_NavigationInfo": ["getNavigationInfo", "NAVIGATION_SET_STATE"],
            "_OnClickOutside": ["Component lacks a handleClickOutside(event) function for processing outside click events."],
            "_PageActions": ["ERROR while creating new tab. Original message"],
            "_PageStore": ["section=Speed-dials&activeSpeedDialIndex=0"],
            "_PageZoom": ["onUIZoomChanged.addListener"],
            "_PrefCache": ["Unknown prefs property:"],
            "_PrefKeys": ["vivaldi.downloads.update_default_download_when_saving_as"],
            "_PrefSet": ["Not known how to make event handler for pref "],
            "_ProgressInfo": ["getProgressInfo", "PAGE_SET_PROGRESS"],
            "_RazerChroma": ["Error setting Razer Chroma color"],
            "_ShowMenu": ["menubarMenu.onAction.addListener", "containerGroupFolders"],
            "_ShowUI": ['document.getElementById("app")', "JS init startup"],
            "_UIActions": ["_maybeShowSettingsInWindow"],
            "_UrlFieldActions": ["history.onVisitRemoved.addListener"],
            "_VivaldiSettings": ["_vivaldiSettingsListener"],
            "_WindowActions": [".windowPrivate.onMaximized"],

            "_svg_addressbar_btn_backward": ["M15.2929 20.7071C15.6834 21.0976 16.3166 21.0976 16.7071 20.7071C17.0976 20.3166 17.0976"],
            "_svg_addressbar_btn_fastbackward": ["M9 8C9 7.44772 9.44772 7 10 7C10.5523 7 11 7.44772 11 8V12L15.2929 7.70711C15.9229"],
            "_svg_addressbar_btn_fastforward": ["M17 18C17 18.5523 16.5523 19 16 19C15.4477 19 15 18.5523 15 18L15"],
            "_svg_addressbar_btn_forward": ["M9.29289 19.2929C8.90237 19.6834 8.90237 20.3166 9.29289 20.7071C9.68342 21.0976 10.3166 21.0976 10"],
            "_svg_addressbar_btn_home": ["M14.0607 5.14645C13.4749 4.56066 12.5251 4.56066 11.9393 5.14645L5"],
            "_svg_addressbar_btn_reload": ["M20 6.20711C20 5.76166 19.4614 5.53857 19.1464 5.85355L17.2797 7.72031C16.9669 7.46165 16.632 7.22741"],
            "_svg_addressbar_btn_reload_stop": ["M8.70711 7.29289C8.31658 6.90237 7.68342 6.90237 7.29289 7.29289C6.90237 7.68342 6.90237"],
            // "_svg_bookmarked": ["M4,1 L4,14 L8,12 L12,14 L12,1 L4,1 Z M6,3 L10,3 L10,10.763"],
            // "_svg_bookmarks_toolbar_import": ["M13 18l4-4H9l4 4zM12 8v6h2V8h-2z"],
            "_svg_bookmarks_update_thumbnail": ["M12.6 7C9.507 7 7 9.506 7"],
            "_svg_btn_delete": ["M13.5 6l-1.4-1.4-3.1 3-3.1-3L4.5"],
            // "_svg_btn_dropdown": ["M8 11l4-6H4l4 6z"],
            // "_svg_btn_minus": ["M9 14h8v-2H9v2z"],
            // "_svg_btn_paneltoggle": ["195v12h-16v-12h16zm-10"],
            // "_svg_btn_plus": ["M11.975 14.04H9.02v-2.036h2.955V9h2.037v3.004h2.982v2.037h-2.982v2.934h-2.037V14.04z"],
            "_svg_button_restart": ["M13 13H6V6l7 7z"],
            // "_svg_menu_bookmarks": ["M3 2v12l5-2 5 2V2H3zm8 9L8 9.646 5 11V4h6v8-1z"],
            // "_svg_menu_contacts": ["M10.4 7.43c1.02 0 1.8-.744 1.8-1.716"],
            // "_svg_menu_downloads": ["M8.914 6.995V3H6.057v3.995c0"],
            // "_svg_menu_mail": ["3v10h14V3H1zm7"],
            // "_svg_menu_notes": ["2v12h10V2H3zm9 11H4V4h8v9z"],
            // "_svg_menu_settings": ["M12.55 8v.592l1.325 1.014c.088.084.177.253.088.338l-1.236"],
            "_svg_menu_vivaldi": ["M10.9604 4.44569C10.4629 3.42529 10.9928 2.28123 12.0753 2.03561C12.9563 1.83607 13.8679 2.4994 13.9847 3.41546C14.0358 3.81793 13.958 4.18653 13.763 4"],
            "_svg_notes_add_attachment": [".436.28.97.7.97h5.95c.98 0 1.75-1.043 1.75-2.06 0-1.02-.77-1.82-1.75"],
            // "_svg_notes_happynote": ['id="eye"'],
            // "_svg_pageactionchooser": ["M5.3 9.8L.8 6.5l4.6-3.3L6.6 5 4.2 6.4l2.3 1.7-1.2 1.6M10.7"],
            "_svg_panel_bookmarks": ["M16.2929 20.2929L13 17L9.70711 20.2929C9.07714 20.9229 8 20.4767 8 19.5858V6C8 5.44772 8.44772 5 9 5H17C17.5523 5 18 5.44772 18 6V19.5858C18 20"],
            // "_svg_panel_contacts": ["M15.6 19h5.4v-2.2c0-1.5-3-2.8-4.7-2.8-.7"],
            // "_svg_panel_downloads": ["M15 6h-4v5h-4l6 6 6-6h-4v-5zm-9"],
            "_svg_panel_downloads_btn_resume": ["M16 13l-6 5V8l6 5z"],
            // "_svg_panel_downloads_btn_stop": ["M9 9h8v8H9z"],
            // "_svg_panel_history": ["M13.5 21a7.5 7.5 0 1 0 0-15 7.5 7.5"],
            // "_svg_panel_mail": ["8v11h16V8H5zm8"],
            // "_svg_panel_notes": ["20h12v-14h-12v14zm2-11h8v9h"],
            // "_svg_panel_settings": ["M10.982 17.576v.424l.404 1.704c0 .197.101.296.303.296h2.725c.101"],
            // "_svg_search_change_engine": ["M-182.6 201.9c.4-.7.7-1.5.7-2.3"],
            // "_svg_settings_category_addressbar": ["M0 0v10h16v-10h-16zm2"],
            // "_svg_settings_category_all": ["M16 9.077v-2.155l-1.913-.68c"],
            // "_svg_settings_category_appearance": ["4h16v10H0V4zm2"],
            // "_svg_settings_category_bookmarks": ["M3 2v13.333l5-1.666"],
            // "_svg_settings_category_downloads": ["M2 14h12v2h-12v-2zm12-4h2v6h-2v-6zm-14"],
            // "_svg_settings_category_keyboard": ["M0 4v9h16v-9h-16zm7"],
            // "_svg_settings_category_mail": ["M0 0v12h16v-12h-16zm8"],
            "_svg_settings_category_mouse": ["M7.5 0c-3.025 0-5.5 2.314-5.5"],
            // "_svg_settings_category_network": ["M9 8v2h-2v-2h-4v2h-2v-4h6v-2h-2v-4h6v4h"],
            // "_svg_settings_category_panel": ["M16 0v12h-16v-12h16zm-10"],
            "_svg_settings_category_privacy": ["M8 13c3.636 0 6.764-2.067"],
            // "_svg_settings_category_qc": ["M8 7.042l-4-4.042h3l4"],
            // "_svg_settings_category_search": ["M11.172 9.757l4.192 4.192-1.414"],
            // "_svg_settings_category_start_page": ["2h7v6h-7zm8 0h7v6h-7zm-8"],
            // "_svg_settings_category_startup": ["M9.96 2.446c-.498-1.02.032-2.164"],
            // "_svg_settings_category_tabs": ["M0 9h16v2h-16v-2zm0"],
            "_svg_settings_category_themes": ["M5.976 11c-1.92.537-1.91"],
            // "_svg_settings_category_webpages": ["M8 1c-3.9 0-7 3.1-7 7s3.1"],
            "_svg_sorting_selector_descending": ["M5.5.133l.11-.11 4.456"],
            // "_svg_speeddial_update_thumbnail": ["M13 4c-4.95 0-9 4.05-9 9s4.05 9 9 9c4.163"],
            // "_svg_startpage_newfolder": ['id="smallplus"'],
            // "_svg_tabstrip_btn_newtab": ["M7 9h-4v-2h4v-4h2v4h4v2h-4v4h-2v-4zm-7-9v16h16v-16h-16z"],
            "_svg_tabstrip_btn_trashcan": ['"trashicon-content"'],
            // "_svg_toggleimages_noimages": ["M16 2H0v12h16V2zM4.89"],
            "_svg_vivaldi_title": ["M11 20c3.94 0 6.14 0 7.57-1.43S20 14.94 20 11s0-6.14-1.43-7.57S14.94 2 11 2 4.86 2 3.43 3.43 2 7.06 2 11s0 6.14 1.43 7.57S7.06 20 11 20"],
            "_svg_window_close": ["0h2v1H6V2zm1-1h2v1H7V1zM3"],
            "_svg_window_close_mac": ["window-close-glyph dpi-standard"],
            "_svg_window_close_win10": ["M10.2.5l-.7-.7L5 4.3.5-.2l-.7.7L4.3"],
            "_svg_window_minimize": ["M1 7h8v2H1z"],
            "_svg_window_minimize_mac": ["window-minimize-glyph dpi-standard"],
            "_svg_window_minimize_win10": ["M0 5H10V6H0V5Z"],
            "_svg_window_zoom": ["7h10v1H0V8zm0-6h1v6H0V2zm9"],
            "_svg_window_zoom_mac": ["window-zoom-glyph dpi-standard"],
            "_svg_window_zoom_win10": ["0H2v2H0v8h8V8h2V0H3zm4"],
            //todo:
            // "_svg_notes_tree_note": ["2h10v12h-10v-12zm1 2h8v9h-8v-9zm1"],
            // "_svg_notes_tree_note_has_url": ["M13 8v-6h-10v12h7v2l2.5-2"],
            // "_svg_vivaldi_horizontal_menu": ['id="horizontal-menu-button'],
            // "_svg_vivaldi_v": ["M14.726 7.446c-.537-1.023.035-2.164 1.2-2.41.948-.2"],
        }

        function replaceAll(str, match, to) { return str.split(match).join(to) }

        function AddAndCheck(modIndex, moduleName) {
            if (("undefined" !== typeof jdhooks._moduleMap[moduleName]) && (jdhooks._moduleMap[moduleName] != modIndex))
                console.log(`jdhooks: repeated module name "${moduleName}"`)

            if (jdhooks._moduleNames[modIndex]) {
                console.log(`jdhooks: multiple names for module ${modIndex}: ${moduleName}, ${jdhooks._moduleNames[modIndex]}...`)
                return true
            }

            jdhooks._moduleMap[moduleName] = modIndex
            jdhooks._moduleNames[modIndex] = moduleName
            return true
        }

        for (const modIndex in jdhooks._modules) {
            let found = false

            const fntxt = jdhooks._modules[modIndex].toString()
            const fntxtPrepared = replaceAll(replaceAll(replaceAll(fntxt, "\\\\", "/"), '\r', ' '), '\n', ' ')

            //localization modules
            if (!fastProcessModules) {
                let match = /defineLocale\("(.*?)"/.exec(fntxtPrepared)
                if (match) {
                    AddAndCheck(modIndex, "locale_" + match[1])
                }
            }

            let lastJsxFound = undefined
            let jsxNameVars = [] //minified variable name -> displayable name
            Array.from(fntxtPrepared.matchAll(/([\w\d$]+)\s*[=:]\s*"[^"]+components\/([\-\w\/]+?)\.js[x]?\"/g))
                .forEach(([$, varName, Name]) => {
                    Name = replaceAll(Name, "/", "_")
                    lastJsxFound = Name
                    jsxNameVars[varName] = Name
                })

            if (lastJsxFound) {
                AddAndCheck(modIndex, lastJsxFound)

                let clsMatches = Array.from(fntxtPrepared.matchAll(/\bclass\s+([$\w\d]+)?\s*extends[\s]+[\w\.]+Component/g))

                for (i in clsMatches) {
                    let className = clsMatches[i][1]

                    let classBodyHere = fntxtPrepared.slice(clsMatches[i].index,
                        clsMatches.hasOwnProperty[i + 1] ? clsMatches[i + 1].index : fntxtPrepared.length)

                    //source file name from variable(jsxNameVars) or string
                    let fileNameMatches = /__source:\s*\{\s*fileName:\s*(([\w\d$]+)|(\"[^"]+components\/([\-\w\/]+?)\.js[x]?\")),/.exec(classBodyHere)
                    if (fileNameMatches) {
                        let classReadableName = fileNameMatches[2] ? jsxNameVars[fileNameMatches[2]] : replaceAll(fileNameMatches[4], "/", "_")

                        if (classNameCache[modIndex + className]) console.log("jdhooks: duplicated class table item", modIndex + className, classNameCache[modIndex + className], classReadableName)
                        classNameCache[className + "_" + modIndex] = classReadableName
                    }
                }
            }

            for (const jsxModuleName in jsxNames) {
                if (-1 !== fntxtPrepared.indexOf(jsxNames[jsxModuleName])) {
                    found = AddAndCheck(modIndex, jsxModuleName)
                    if (fastProcessModules) delete jsxNames[jsxModuleName]
                    break
                }
            }
            if (fastProcessModules && found) continue

            //signatures
            for (const moduleName in moduleSignatures) {
                if (moduleSignatures[moduleName].every(i => -1 < fntxt.indexOf(i))) {
                    found = AddAndCheck(modIndex, moduleName)
                    if (fastProcessModules) delete moduleSignatures[moduleName]
                    break
                }
            }
        }


        function checkUnknown(obj) {
            for (const moduleName in obj)
                if (!jdhooks._moduleMap[moduleName]) {
                    console.log("jdhooks: unknown module", moduleName)
                }
        }

        checkUnknown(jsxNames)
        checkUnknown(moduleSignatures)
    }

    //---------------------------------------------------------------------

    function jdhooks_module_step2(startupModule, modules_list) {
        modules_list["newStartup"] = modules_list[startupModule]
        modules_list[startupModule] = function () { }

        jdhooks._modules = modules_list
        makeSignatures()

        //override "require" so we can store module indexes for classes extending PureComponent/Component
        //which in turn allows to hook classes
        function overrideRequire(require, moduleIndex) {
            req = (mod) => {
                let imported = require(mod)
                //TODO: check React wrappers?
                if (0 !== mod) {
                    return imported
                } else {

                    let cached = new WeakMap()

                    function PureComponent(props, context, updater) { imported.PureComponent.apply(this, arguments) }
                    PureComponent.prototype = { ...imported.PureComponent.prototype, ...PureComponent.prototype, ...{ jdhooks_module_index: moduleIndex } }

                    function Component(props, context, updater) { let ret = imported.Component.apply(this, arguments) }
                    Component.prototype = { ...imported.Component.prototype, ...Component.prototype, ...{ jdhooks_module_index: moduleIndex } }

                    return {
                        ...imported,
                        ...{
                            Component: Component,
                            PureComponent: PureComponent,

                            createElement: (type, ...e) => {
                                //TODO: check if type extends PureComponent or Component directly?
                                if (type.prototype && type.prototype.jdhooks_module_index) {
                                    let cachedType = cached.get(type)
                                    if (cachedType) {
                                        type = cachedType
                                    }
                                    else {
                                        origtype = type
                                        let className = classNameCache[type.name + "_" + type.prototype.jdhooks_module_index]
                                        if (className) {
                                            type.prototype.__jdhooks_instanceof = className
                                            for (cb of hookClassList[className] || []) { type = cb(type) }
                                            delete jdhooks._unusedClassHooks[className]
                                        }
                                        cached.set(origtype, type)
                                    }
                                }
                                let r = imported.createElement(type, ...e)
                                if (type.prototype && type.prototype.__jdhooks_instanceof)
                                    r.__jdhooks_instanceof = type.prototype.__jdhooks_instanceof
                                return r
                            }
                        }
                    }
                }
            }
            for (k in require) req[k] = require[k]
            return req
        }

        let callStack = []
        for (const moduleIndex in modules_list) {
            let oldfn = modules_list[moduleIndex]
            modules_list[moduleIndex] = (moduleInfo, exports, require) => {
                callStack.push(moduleInfo.i)
                oldfn(moduleInfo, exports, overrideRequire(require, moduleIndex))
                callStack.pop()
            }
        }

        hookModule("common_InsertVivaldiSettings", (moduleInfo, exports) => (type, paramArray) => {
            let className = type.__jdhooks_instanceof
                ? type.__jdhooks_instanceof
                : type && type.prototype
                    ? classNameCache[type.name + "_" + type.prototype.jdhooks_module_index]
                    : undefined

            if (className && hookClassSettings[className]) { paramArray = paramArray.concat(hookClassSettings[className]) }

            let r = exports(type, paramArray)
            if (className) r.__jdhooks_instanceof = className
            return r
        })

        hookModule("common_InsertPrefsCache", (moduleInfo, exports) => (type, paramArray) => {
            let className = type.__jdhooks_instanceof
                ? type.__jdhooks_instanceof
                : type && type.prototype
                    ? classNameCache[type.name + "_" + type.prototype.jdhooks_module_index]
                    : undefined
            if (className && hookClassPrefs[className]) { paramArray = paramArray.concat(hookClassPrefs[className]) }

            let r = exports(type, paramArray)
            if (className) r.__jdhooks_instanceof = className
            return r
        })

        //wait for UI
        hookModule("_RazerChroma", (moduleInfo, exports) => {
            return jdhooks.hookMember(exports, "init",
                (hookData) => document.dispatchEvent(new Event(jdhooks_ui_ready_event)))
        })
    }

    function jdhooks_module_step1(moduleInfo, exportsInfo, nrequire) {

        let cl = arguments.callee
        while (cl.caller != null) cl = cl.caller
        let match = cl.toString().match(/\.\s*push\s*\(\s*\[\s*(\d+)/m)
        if (null == match) return
        let startupModule = Number(match[1])

        for (const propertyName in nrequire) {
            if (nrequire[propertyName] && nrequire[propertyName][jdhooks_module_index] && nrequire[propertyName][jdhooks_module_index].name) {
                let modules_list = nrequire[propertyName]

                jdhooks.require = function (module) {
                    let retValue = null

                    if ("number" === typeof module) retValue = nrequire(module)
                    else {
                        if ("undefined" === typeof jdhooks._moduleMap[module])
                            throw "jdhooks.require: unknown module " + module

                        retValue = nrequire(vivaldi.jdhooks._moduleMap[module])
                    }
                    if (retValue.hasOwnProperty("a")) retValue = retValue.a
                    else
                        if (retValue.hasOwnProperty("default")) retValue = retValue.default //todo: whitelist?

                    return retValue
                }

                jdhooks_module_step2(startupModule, modules_list)
                loadHooks(_ => nrequire("newStartup")) //run
                break
            }
        }
    }

    window.webpackJsonp.push([[0], { [jdhooks_module_index]: jdhooks_module_step1 }, [[jdhooks_module_index]]])
})()
