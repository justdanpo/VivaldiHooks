//var result = vivaldi.jdhooks.require(moduleName, exportName)
//vivaldi.jdhooks.hookClass(className, class => newClass)
//vivaldi.jdhooks.hookModuleExport(moduleName, exportName, export => newExport)
//vivaldi.jdhooks.onUIReady(function())
//vivaldi.jdhooks.addStyle(style)
//vivaldi.jdhooks.insertWatcher(cls, {settings:[], prefs:[]})

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
        console.warn(`hookModule is deprecated and will be removed in the nearest future (called for module ${moduleName})`)

        const moduleIndex = vivaldi.jdhooks._moduleMap[moduleName].idx
        const oldfn = vivaldi.jdhooks._modules[moduleIndex]
        vivaldi.jdhooks._modules[moduleIndex] = (moduleInfo, exports, nrequire) => {
            oldfn(moduleInfo, exports, nrequire)

            if (typeof moduleInfo.exports === "object") {
                const keys = Object.keys(moduleInfo.exports)
                if (keys.length === 1) switch (keys[0]) {
                    case "a":
                        return moduleInfo.exports = { ...moduleInfo.exports, ...{ a: newfn(moduleInfo, moduleInfo.exports.a) } }
                    case "default":
                        return moduleInfo.exports = { ...moduleInfo.exports, ...{ default: newfn(moduleInfo, moduleInfo.exports.default) } }
                }
            }
            return moduleInfo.exports = newfn(moduleInfo, moduleInfo.exports)
        }
    }

    //hookModuleExport(moduleName, exportName, export => newExport)
    const hookModuleExport = vivaldi.jdhooks.hookModuleExport = (moduleName, exportName, cb) => {
        const moduleIndex = vivaldi.jdhooks._moduleMap[moduleName].idx
        const oldfn = vivaldi.jdhooks._modules[moduleIndex]
        vivaldi.jdhooks._modules[moduleIndex] = (moduleInfo, exports, nrequire) => {
            oldfn(moduleInfo, exports, nrequire)

            const fn = vivaldi.jdhooks._moduleMap[moduleName].cached[exportName] || trySignatures(moduleName, exportName, moduleInfo.exports)

            return moduleInfo.exports = fn.updated(moduleInfo.exports, cb(fn.get(moduleInfo.exports)))
        }
    }

    //hookClass(className, function(class))
    let hookClassList = {}
    jdhooks._unusedClassHooks = {} //stats

    const hookClass = vivaldi.jdhooks.hookClass = (className, cb) => {
        hookClassList[className] = hookClassList[className] || []
        hookClassList[className].push(cb)
        vivaldi.jdhooks._unusedClassHooks[className] = true
    }

    //hookMember(object, memberName, function(hookData,oldarglist), function(hookData,oldarglist))
    const hookMember = vivaldi.jdhooks.hookMember = function (obj, memberName, cbBefore = null, cbAfter = null) {
        console.warn("hookMember is deprecated and will be removed in the nearest future")

        if (!obj.hasOwnProperty(memberName))
            throw `jdhooks.hookMember: wrong member name ${memberName}`

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

    //insertWatcher(cls, params)
    const insertWatcher = vivaldi.jdhooks.insertWatcher = (cls, params) => {
        const vivaldiSettings = vivaldi.jdhooks.require("vivaldiSettings")
        const PrefsCache = vivaldi.jdhooks.require("PrefsCache")
        return class extends cls {
            constructor(...e) {
                super(...e)

                this.state = this.state || {}
                if (params.settings) this.state.jdVivaldiSettings = {
                    ...this.state.jdVivaldiSettings || {},
                    ...vivaldiSettings.getKeysSync(params.settings)
                }
                if (params.prefs) this.state.jdPrefs = {
                    ...this.state.jdPrefs || {},
                    ...PrefsCache.getList(params.prefs)
                }
                this.changeSettingsHandler = this.changeSettingsHandler.bind(this)
                this.changePrefsHandler = this.changePrefsHandler.bind(this)
            }
            changeSettingsHandler(oldValue, newValue, key) {
                this.setState(state => ({ jdVivaldiSettings: { ...state.jdVivaldiSettings, [key]: newValue } }))
            }
            changePrefsHandler(oldValue, newValue, key) {
                this.setState(state => ({ jdPrefs: { ...state.jdPrefs, [key]: newValue } }))
            }
            componentDidMount() {
                if (super.componentDidMount) super.componentDidMount()
                for (const key of params.settings || []) vivaldiSettings.addListener(key, this.changeSettingsHandler)
                for (const key of params.prefs || []) PrefsCache.addListener(key, this.changePrefsHandler)
            }
            componentWillUnmount() {
                for (const key of params.prefs || []) PrefsCache.removeListener(key, this.changePrefsHandler)
                for (const key of params.settings || []) vivaldiSettings.removeListener(key, this.changeSettingsHandler)
                if (super.componentWillUnmount) super.componentWillUnmount()
            }
        }
    }
    //---------------------------------------------------------------------
    const defaultGetFn = {
        get: o => o,
        updated: (_, v) => v
    }
    function trySignatures(module, exportName, obj) {
        function getFnByMemberName(memberName) {
            return {
                get: o => o[memberName],
                updated: (o, v) => { return { ...o, [memberName]: v } }
            }
        }

        let moduleMap = jdhooks._moduleMap[module]
        if (obj[exportName])
            return moduleMap.cached[exportName] = getFnByMemberName(exportName)

        if (exportName == "default" && (Object.keys(obj).length == 1) && obj.a)
            return moduleMap.cached[exportName] = getFnByMemberName("a")

        if (!moduleMap.exports) {
            if (Object.keys(obj).length > 1 && obj.b) {
                console.log(`jdhooks: please check module "${module}" exports`, { exports: obj })
            }
            return moduleMap.cached[exportName] = defaultGetFn
        }

        const exportSig = moduleMap.exports[exportName]
        if (!exportSig)
            throw `jdhooks: unknown export ${exportName} for module ${module}`

        function checkExport(exp, exportSig, fn) {
            let found = false
            if (typeof exp === "object") {
                found = exportSig.every(i => exp[i])
            } else {
                const expString = exp.toString()
                found = exportSig.every(i => -1 < expString.indexOf(i))
            }
            return found ? fn : undefined
        }

        const rootExports = checkExport(obj, exportSig, defaultGetFn)
        if (rootExports) return moduleMap.cached[exportName] = rootExports

        for (const i in obj) {
            const checkedExport = checkExport(obj[i], exportSig, getFnByMemberName(i))
            if (checkedExport) return moduleMap.cached[exportName] = checkedExport
        }

        return undefined
    }

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
                        cfg = { ...{ JDHOOKS_STARTUP: { defaultLoad: false, scripts: {} } }, ...cfg }

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
                                Elem.src = `hooks/${dirItem.name}`
                                pendingscripts[Elem.src] = true

                                Elem.onload = function (e) {
                                    delete pendingscripts[this.src]
                                    checkFinished()
                                }
                            }

                            if (fileExt === "CSS") {

                                Elem = document.createElement("link")
                                Elem.href = `hooks/${dirItem.name}`
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
            "BookmarkActions": { signature: ["Error removing bookmark tree:"], exports: { "default": ["createBookmark"] } },
            "buffer": { signature: ["The buffer module from node.js, for the browser"] },
            "charenc": { signature: ["stringToBytes(unescape(encodeURIComponent("] },
            "chroma.js": { signature: ["chroma.js"] },
            "classnames": { signature: ["jedwatson.github.io/classnames"] },
            "CommandActions": { signature: ["commandChanged", "restoreCommandGestures", "executeActions"] },
            "core-js-internals-a-function": { signature: ['" is not a function!"'] },
            "core-js-internals-classof-raw": { signature: [").slice(8,", "{}.toString"] },
            "core-js-internals-global": { signature: ['"return this"', "window.Math"] },
            //"core-js-internals-is-array": { signature: ["Array.isArray", '"Array"'] },
            "core-js-internals-task": { signature: ['"onreadystatechange"', ".importScripts"] },
            "createDOMPurify": { signature: ["TrustedTypes policy", '"beforeSanitizeElements"'] },//DOMPurify
            "date-fns-build_format_locale": { signature: ["formattingTokensRegExp:", '"Tuesday"'] },
            "date-fns-distance_in_words": { signature: ['"less than {{count}} seconds"'] },
            "date-fns-format": { signature: ['"YYYY-MM-DDTHH:mm:ss.SSSZ"', ".format.formattingTokensRegExp"] },
            "date-fns-get_days_in_month": { signature: [".getFullYear()", ".getMonth()", "new Date(0)", ".getDate()"] },
            "date-fns-getTimezoneOffsetInMilliseconds": { signature: [".getTime())", ".getTimezoneOffset()", ".setSeconds(0,"] },
            "date-fns-is_valid": { signature: ['" is not an instance of Date"'] },
            "date-fns-parse": { signature: ["\/^(\\d{2}):?(\\d{2}):?(\\d{2}([.,]\\d*)?)$\/"] },
            //"dom-helpers-addClass": { signature: [".classList.add(", ".default)(", ".className"] },
            //"dom-helpers-removeClass": { signature: ["\" \").replace(\/^\\s*|\\s*$\/g,"] },
            "DownloadActions": { signature: ["_setSearchFilter", '"restartDownload"'] },
            "expr-eval": { signature: ['"IEXPR"', "with(this.functions) with (this.ternaryOps) with (this.binaryOps) with (this.unaryOps) { return"] },
            "flux-Dispatcher": { signature: ['._isDispatching', '"ID_"', "this._lastID++"] },
            "flux-FluxReduceStore": { signature: ['"FluxReduceStore"', ".prototype.getInitialState"] },
            "highlight.js-languages-apache": { signature: ["keywords:", '"order deny allow setenv rewriterule rewriteengine rewritecond documentroot '] },
            "highlight.js-languages-applescript": { signature: ["keywords:", '"AppleScript false linefeed return'] },
            "highlight.js-languages-bash": { signature: ["keywords:", '"if then else elif fi for'] },
            "highlight.js-languages-basic": { signature: ["keywords:", '"ABS ASC AND ATN AUTO|0'] },
            "highlight.js-languages-coffeescript": { signature: ["keywords:", '"//[gim]*"'] },
            "highlight.js-languages-cpp": { signature: ["keywords:", '"int float while private'] },
            "highlight.js-languages-css": { signature: ["keywords:", 'selector-id', "/#[A-Za-z0-9_-]+/"] },
            "highlight.js-languages-diff": { signature: ["\/^\\*\\*\\* +\\d+,\\d+ +\\*\\*\\*\\*$\/"] },
            "highlight.js-languages-django": { signature: [".COMMENT(\/\\{%\\s*comment\\s*%}\/"] },
            "highlight.js-languages-dockerfile": { signature: ["keywords:", '"from maintainer expose env arg user onbuild stopsignal'] },
            "highlight.js-languages-dos": { signature: ["keywords:", '"if else goto for in do call exit not exist'] },
            "highlight.js-languages-ini": { signature: ["\/\\bon|off|true|false|yes|no\\b\/"] },
            "highlight.js-languages-java": { signature: ["keywords:", '"jsp"'] },
            "highlight.js-languages-javascript": { signature: ["keywords:", '"js"'] },
            "highlight.js-languages-json": { signature: ["keywords:", '"true false null"', '"{"', '"attr"'] },
            "highlight.js-languages-less": { signature: ["beginKeywords:", "(url|data-uri)\\\\("] },
            "highlight.js-languages-markdown": { signature: ["excludeBegin:", '"mkdown"'] },
            "highlight.js-languages-mathematica": { signature: ["keywords:", '"mma"'] },
            "highlight.js-languages-matlab": { signature: ["keywords:", '"break case catch classdef continue else elseif end enumerated'] },
            "highlight.js-languages-nginx": { signature: ["keywords:", '"on off yes no true false none blocked debug'] },
            "highlight.js-languages-objectivec": { signature: ["keywords:", '"int float while char export sizeof typedef const'] },
            "highlight.js-languages-perl": { signature: ["keywords:", '"getpwent getservent quotemeta msgrcv scalar kill'] },
            "highlight.js-languages-python": { signature: ["keywords:", '"and elif is global as in if from raise for except'] },
            "highlight.js-languages-ruby": { signature: ["keywords:", '"and then defined module in return redo if BEGIN'] },
            "highlight.js-languages-scss": { signature: ["keywords:", "whitespace|wait|w-resize|visible|vertical-text|vertical-ideographic"] },
            "highlight.js-languages-shell": { signature: ["subLanguage:", '"console"'] },
            "highlight.js-languages-sql": { signature: ["keywords:", '"begin end start commit rollback savepoint lock alter'] },
            "highlight.js-languages-swift": { signature: ["keywords:", "__COLUMN__ __FILE__ __FUNCTION__ __LINE__"] },
            "highlight.js-languages-typescript": { signature: ["keywords:", '"ts"'] },
            "highlight.js-languages-vim": { signature: ["keywords:", '"N|0 P|0 X|0 a|0 ab abc abo al am an'] },
            "highlight.js-languages-xml": { signature: ["subLanguage:", '"html"', '"rss"'] },
            "highlight.js": { signature: ["initHighlightingOnLoad", "highlight|plain|text"] },
            "HistoryActions": { signature: ["saveStateFromSearchQuery", '"HISTORY_REMOVE_VISITS"'] },
            "immutability-helper-update": { signature: ["update(): You provided an invalid spec to update()"] },
            "immutable-devtools": { signature: ["@@__IMMUTABLE_RECORD__@@", "OrderedMapFormatter"] },
            "immutable": { signature: ["@@__IMMUTABLE_ITERABLE__@@", '"@@iterator"', "__immutablehash__"] },
            "keyMirror": { signature: ["keyMirror(...): Argument must be an object."] },
            "linkify": { signature: ["`splitRegex` must have the 'g' flag set"] },//remarkable plugin
            "lodash-memoize": { signature: ['new TypeError("Expected a function")', ".Cache", ".apply(this,"] },
            "lodash": { signature: ['"lodash"', "filter|find|map|reject"] },
            "moment.js": { signature: ["use moment.updateLocale"] },
            "node-crypt": { signature: ["rotl:", "hexToBytes:"] },
            "normalize-url": { signature: ["removeQueryParameters:", "stripWWW:"] },
            "NoteActions": { signature: ["createNotesFromTreeNodes", '"NotesCutIds"'] },
            "Object.Assign": { signature: ["Object.assign cannot be called with null or undefined"] },
            "PageActions": { signature: ["moveDroppedTabs:", "https://vivaldi.com/newfeatures?hl="], exports: { "default": ["createTabStack"] } },
            "PanelActions": { signature: ["setPanelResizable", '"PANEL_SHOW_CONTENT"'] },
            "PrefsCache": { signature: ["Unknown prefs property:"] },
            "process": { signature: ["process.binding is not supported"] },
            "prop-types-factoryWithTypeCheckers": { signature: [".checkPropTypes", "Read more at http://fb.me/use-check-prop-types"] },
            "prop-types-ReactPropTypesSecret": { signature: ['"SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED"'] },
            "punycode": { signature: ['"Overflow: input needs wider integers to process",'] },
            "react-css-transition-replace": { signature: ['"ReactCSSTransitionReplace"'] },
            "react-motion": { signature: ["startAnimationIfNecessary", "lastIdealVelocity"] },
            "react-transition-group-TransitionGroup": { signature: [".childContextTypes", '"childFactory"', '"div"'] },
            "React": { signature: ["react.production."], exports: { "default": ["createElement"] } },
            "ReactDOM": { signature: ["react-dom.production."], exports: { "default": ["findDOMNode"] } },
            "remarkable": { signature: ["Wrong `remarkable` preset, check name/content"] },
            "scheduler": { signature: ["scheduler.production."] },
            "SearchEngineActions": { signature: ["setDefaultForSpeedDial", '"SEARCH_ENGINE_COLLECTION"'] },
            "setProgressState": { signature: ["setProgressState", '"PAGE_SET_PROGRESS"'] },
            "Startup": { signature: ['document.getElementById("app")', "JS init startup"] },
            "StatusActions": { signature: ['"STATUS_SET_STATUS"', '"setStatus"'] },
            "SyncActions": { signature: ["setEncryptionPassword", '"SYNC_ENGINE_STATE_CHANGED"'] },
            "TrashActions": { signature: ["Error restoring tab:", "undeletePreviousTab"] },
            "turndown": { signature: ["is not a string, or an element/document/fragment node.", "turndown:"] },
            "url": { signature: [".prototype.parseHost"], exports: { "default": ["Url"] } },
            "urlbarstore": { signature: ['"READERMODE_SET_STYLE"', "showTypedHistory()"] },
            "utf8js": { signature: ["https://mths.be/utf8js"] },
            "velocity-react-velocity-animate-shim": { signature: [".velocityReactServerShim", 'navigator.userAgent.indexOf("Node.js")'] },
            "velocity-react-velocity-component": { signature: ['"fxqueue"', "_clearVelocityCache"] },
            "velocity-react-velocity-helpers": { signature: ['"VelocityHelper.animation."'] },
            "velocity-react-velocity-transition-group": { signature: ["this._scheduledAnimationRunFrames.push("] },
            "velocity-react": { signature: ['"VelocityComponent"', '"velocityHelpers"'] },
            "velocity.js": { signature: ["VelocityJS.org"] },
            "VivaldiAccountActions": { signature: ["VIVALDI_ACCOUNT_STATE_UPDATED", "vivaldiAccount.login"] },
            "VivaldiFeatureFlags": { signature: ["Enabling feature failed:"] },
            "vivaldiSettings": { signature: ["_vivaldiSettingsListener"] },
            "webpack-buildin-module": { signature: ["Object.defineProperty(", '"loaded",', ".paths"] },
            "webpack-runtime-GlobalRuntimeModule": { signature: ['new Function("return this")()'] },
            "WindowActions": { signature: ['Error("WindowActions: Window does not have an id.")'] },
            "yoga-layout": { signature: ["computeLayout:", "fillNodes:"] },

            "_ActionList_DataTemplate": { signature: ["CALENDAR_NOTIFICATION_CHANGED:", "CHROME_TABS_API:"] },
            "_BookmarkStore": { signature: ["validateAsBookmarkBarFolder"], exports: { "default": ["validateAsBookmarkBarFolder"] } },
            "_CommandManager": { signature: ['emitChange("shortcut")'] },
            "_CSSTransitionGroup": { signature: ['"CSSTransitionGroup"'] },
            "_CSSTransitionGroupChild": { signature: ['"CSSTransitionGroupChild"', ".displayName"] },
            "_decodeDisplayURL": { signature: [".getDisplayUrl(", "decodeURI("], exports: { "formatUrl": ["view-source:", ".getDisplayUrl"] } },
            "_getLocalizedMessage": { signature: [".i18n.getMessage"] },
            "_getPrintableKeyName": { signature: ['"BrowserForward"', '"PrintScreen"'] },
            "_HistoryStore": { signature: ["HISTORY_LOAD_TODAY", ".visitCount"] },
            "_HotkeyManager": { signature: ["handleShortcut:"] },
            "_KeyCodes": { signature: ["KEY_CANCEL:"] },
            "_NavigationInfo": { signature: ["getNavigationInfo", "NAVIGATION_SET_STATE", '.emitChange("setPermissionInfo")'] },
            "_NotesStore": { signature: ['"vivaldi/x-notes"'] },
            "_PageStore": { signature: ["section=Speed-dials&activeSpeedDialIndex=0"], exports: { "default": ["getPageById"] } },
            "_PageZoom": { signature: ["onUIZoomChanged.addListener"] },
            "_PanelStore": { signature: ["getSelectedPanel:", ".PANEL_SET_PANELS:"] },
            "_PrefKeys": { signature: ["vivaldi.downloads.update_default_download_when_saving_as"], exports: { "default": ["kAddressBarPosition"] } },
            "_PrefSet": { signature: ["Not known how to make event handler for pref "] },
            "_ProgressInfo": { signature: ["getProgressInfo", "PAGE_SET_PROGRESS"] },
            "_RazerChroma": { signature: ["Error setting Razer Chroma color"] },
            "_Search": { signature: ["withPageSelection:"] },
            "_SearchEnginesStore": { signature: ['"vivaldi/x-search-engine"'], exports: { "default": ["getCurrentSD"] } },
            "_ShowMenu": { signature: ["menubarMenu.onAction.addListener", ".menu.expandId"] },
            "_Theme": { signature: ["fgBgHighlight", "colorAccentBgDarker:"] },
            "_TransitionGroup": { signature: ['"TransitionGroup"'] },
            "_UIActions": { signature: [".runtimePrivate.switchToGuestSession"] },
            "_UrlFieldActions": { signature: ["history.onVisitRemoved.addListener"] },
            "_urlutils": {
                signature: ["Guest Profile Introduction"], exports: {
                    "default": ["getDisplayUrl"],
                    "urls": ["actionlog"]
                }
            },
            //"_VivaldiIcons": { signature: ["small:", "medium:", "large:"] },
            "_WebViewStore": { signature: ["getActiveWebView()", ".WEBVIEW_CLEAR_IF_ACTIVE:"] },
            "_WindowStore": { signature: ['"Attempting to toggle toolbars for a window without minimal UI"'], exports: { "default": ["getVisibleUI"] } },

            "_svg_addressbar_btn_backward": { signature: ["M15.2929 20.7071C15.6834 21.0976 16.3166 21.0976 16.7071 20.7071C17.0976 20.3166 17.0976"] },
            "_svg_addressbar_btn_fastbackward": { signature: ["M9 8C9 7.44772 9.44772 7 10 7C10.5523 7 11 7.44772 11 8V12L15.2929 7.70711C15.9229"] },
            "_svg_addressbar_btn_fastforward": { signature: ["M17 18C17 18.5523 16.5523 19 16 19C15.4477 19 15 18.5523 15 18L15"] },
            "_svg_addressbar_btn_forward": { signature: ["M9.29289 19.2929C8.90237 19.6834 8.90237 20.3166 9.29289 20.7071C9.68342 21.0976 10.3166 21.0976 10"] },
            "_svg_addressbar_btn_home": { signature: ["M14.0607 5.14645C13.4749 4.56066 12.5251 4.56066 11.9393 5.14645L5"] },
            "_svg_addressbar_btn_reload": { signature: ["M20 6.20711C20 5.76166 19.4614 5.53857 19.1464 5.85355L17.2797 7.72031C16.9669 7.46165 16.632 7.22741"] },
            "_svg_addressbar_btn_reload_stop": { signature: ["M8.70711 7.29289C8.31658 6.90237 7.68342 6.90237 7.29289 7.29289C6.90237 7.68342 6.90237"] },
            "_svg_bookmarked": { signature: ['id="addBookmarkPath"'] },
            "_svg_bookmarks_large": { signature: ["M16.2929 20.2929L13 17L9.70711 20.2929C9.07714 20.9229 8 20.4767 8 19.5858V6C8 5.44772 8.44772 5 9 5H17C17.5523 5 18 5.44772 18 6V19.5858C18 20"] },
            "_svg_bookmarks_small": { signature: ["M5 2C4.44772 2 4 2.44772 4 3V13.5858C4 14.4767"] },
            "_svg_bookmarks_update_thumbnail": { signature: ["M12.6 7C9.507 7 7 9.506 7"] },
            "_svg_btn_delete": { signature: ["M13.5 6l-1.4-1.4-3.1 3-3.1-3L4.5"] },
            "_svg_btn_minus": { signature: ["M4 8C4 8.55228 4.44772 9 5 9H11C11.5523 9 12 8.55228 12"] },
            "_svg_btn_plus_large": { signature: ["M12 14H9C8.44772 14 8 13.5523 8 13V13C8 12.4477 8.44772 12 9 12H12V9C12"] },
            "_svg_btn_plus_small": { signature: ["M7 7V5C7 4.44772 7.44772 4 8 4C8.55228 4 9 4.44772"] },
            "_svg_button_restart": { signature: ["M13 13H6V6l7 7z"] },
            "_svg_calendar_large": { signature: ["M21 9C21 7.89543 20.1046 7 19 7H18V6C18 5.44772 17.5523"] },
            "_svg_calendar_medium": { signature: ["M4 1C3.44772 1 3 1.44772 3 2C1.89543 2 1 2.89543"] },
            "_svg_calendar_small": { signature: ["M6 5H4v2h2V5zm0 3H4v2h2V8zm1-3h2v2H7V5zm2 3H7v2h2V8zm1-3h2v2h-2V5zm2 3h-2v2h2V8z"] },
            "_svg_contacts_large": { signature: ["M15.3601 14.0944C15.7634 13.2763 16 12.3882 16 11.5V10.7C16 8.97393"] },
            "_svg_contacts_small": { signature: ["M6.32251 9.83154L7.19854 9.13994C7.79551 8.66865 8.18182 7.93438"] },
            "_svg_downloads_large": { signature: ["M11 6C11 5.44772 11.4477 5 12 5H14C14.5523 5 15"] },
            "_svg_downloads_small": { signature: ["M2 9.99988H0V14.9998C0 15.5521 0.447715 15.9998"] },
            "_svg_history_large": { signature: ["M5 13C5 11.1401 5 10.2101 5.20445 9.44709C5.75925 7.37653 7.37653 5.75925 9.44709"] },
            "_svg_history_medium": { signature: ["M7 5.5C7 5.22386 7.22386 5 7.5 5H8.5C8.77614"] },
            "_svg_history_small": { signature: ["M6 2h4a4 4 0 014 4v4a4 4 0 01-4 4H6a4 4 0 01-4-4V6a4 4 0 014-4zM1"] },
            "_svg_mail_large": { signature: ["m6.64645 7.64645c.19526-.19527.51184-.19527.7071"] },
            "_svg_mail_small": { signature: ["M1.64645 2.64645C1.84171 2.45118 2.15829"] },
            "_svg_menu_vivaldi": { signature: ["M10.9604 4.44569C10.4629 3.42529 10.9928 2.28123 12.0753 2.03561C12.9563 1.83607 13.8679 2.4994 13.9847 3.41546C14.0358 3.81793 13.958 4.18653 13.763 4"] },
            "_svg_notes": { signature: ["M13 3H3v11h10V3zM2 2a1 1 0 011-1h10a1 1 0 011 1v12a1"] },
            "_svg_notes_add_attachment": { signature: [".436.28.97.7.97h5.95c.98 0 1.75-1.043 1.75-2.06 0-1.02-.77-1.82-1.75"] },
            "_svg_panel_downloads_btn_resume": { signature: ["M16 13l-6 5V8l6 5z"] },
            "_svg_settings_category_mouse": { signature: ["M7.5 0c-3.025 0-5.5 2.314-5.5"] },
            "_svg_settings_category_privacy": { signature: ["M8 13c3.636 0 6.764-2.067"] },
            "_svg_settings_category_themes": { signature: ["M5.976 11c-1.92.537-1.91"] },
            "_svg_sorting_selector_descending": { signature: ["M5.5.133l.11-.11 4.456"] },
            "_svg_tabs_large": { signature: ["M21 8C21 6.89543 20.1046 6 19 6H7C5.89543"] },
            "_svg_tabs_small": { signature: ["M1 4C1 2.89543 1.89543 2 3 2H13C14.1046 2 15 2.89543"] },
            "_svg_tabstrip_btn_trashcan": { signature: ['"trashicon-content"'] },
            "_svg_vivaldi_title": { signature: ["M18.6 3.4C17.1 2 14.9 2 11 2S4.9 2 3.4 3.4C2 4.9 2 7.1 2 11s0 6.1 1.4 7.6C4.9 20 7.1 20 11 20s6.1"] },
            "_svg_window_close": { signature: ["0h2v1H6V2zm1-1h2v1H7V1zM3"] },
            "_svg_window_close_mac": { signature: ["window-close-glyph dpi-standard"] },
            "_svg_window_close_win10": { signature: ["M10.2.5l-.7-.7L5 4.3.5-.2l-.7.7L4.3"] },
            "_svg_window_minimize": { signature: ["M1 7h8v2H1z"] },
            "_svg_window_minimize_mac": { signature: ["window-minimize-glyph dpi-standard"] },
            "_svg_window_minimize_win10": { signature: ["M0 5H10V6H0V5Z"] },
            "_svg_window_zoom": { signature: ["7h10v1H0V8zm0-6h1v6H0V2zm9"] },
            "_svg_window_zoom_mac": { signature: ["window-zoom-glyph dpi-standard"] },
            "_svg_window_zoom_win10": { signature: ["0H2v2H0v8h8V8h2V0H3zm4"] },
            "_svg_write_1": { signature: ["M13.414.5c-.398 0-.779.158-1.061.439l-1.061 1.061"] },
            "_svg_write_2": { signature: ["M14.05 1.28a.96.96 0 00-1.35 0l-.68.67"] },
            "_svg_write_3": { signature: ["M9 16h2.53l7-7.03-2.54-2.4L9 13.46V16zm11.8-9.33a.64.64"] },

            //background-bundle.js
            //"net": { signature: [".createServer", ".createConnection"] },//dummy; used by stomp
            //"stomp-websocket-stomp-node": { signature: [".overTCP", ".overWS", '"tcp://"'] },
            //"stomp-websocket-stomp": { signature: ["v12.stomp"] },
            //"stomp-websocket": { signature: [".Stomp", ".exports.overTCP"] },
            //"WebSocket-Node-browser": { signature: ["w3cwebsocket:", '"CONNECTING"'] },

            //inject-root-bundle.js
            //"Readability": { signature: ["First argument to Readability constructor should be a document object."] },

            //inject-all-spatnav-bundle.js
            //"scrollIntoViewIfNeeded": { signature: ["Element is required in scrollIntoViewIfNeeded"] },
        }

        function replaceAll(str, match, to) { return str.split(match).join(to) }

        function AddAndCheck(modIndex, moduleName) {
            if (jdhooks._moduleMap[moduleName] && jdhooks._moduleMap[moduleName].idx != modIndex)
                console.log(`jdhooks: repeated module name "${moduleName}"`)

            if (jdhooks._moduleNames[modIndex]) {
                console.log(`jdhooks: multiple names for module ${modIndex}: ${moduleName}, ${jdhooks._moduleNames[modIndex]}...`)
                return true
            }

            jdhooks._moduleMap[moduleName] = { idx: modIndex, cached: { "*": defaultGetFn } }
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
                    AddAndCheck(modIndex, `locale_${match[1]}`)
                }
            }

            let lastJsxFound = undefined
            let jsxNameVars = [] //minified variable name -> displayable name
            Array.from(fntxtPrepared.matchAll(/([\w\d_$]+)\s*[=:]\s*(\(\w\(\d+\),\s*)?"[^"]+components\/([\-\w\/]+?)\.js[x]?\"/g))
                .forEach(([$, varName, $$, Name]) => {
                    Name = replaceAll(Name, "/", "_")
                    lastJsxFound = Name
                    jsxNameVars[varName] = Name
                })

            if (lastJsxFound) {
                AddAndCheck(modIndex, lastJsxFound)

                let clsMatches = Array.from(fntxtPrepared.matchAll(/\bclass\s+([\w\d_$]+)?\s*extends[\s]+[\w\.]+Component/g))

                for (i in clsMatches) {
                    let className = clsMatches[i][1]

                    let classBodyHere = fntxtPrepared.slice(clsMatches[i].index,
                        clsMatches.hasOwnProperty[i + 1] ? clsMatches[i + 1].index : fntxtPrepared.length)

                    //source file name from variable(jsxNameVars) or string
                    let fileNameMatches = /__source:\s*\{\s*fileName:\s*(([\w\d_$]+)|(\"[^"]+components\/([\-\w\/]+?)\.js[x]?\")),/.exec(classBodyHere)
                    if (fileNameMatches) {
                        let classReadableName = fileNameMatches[2] ? jsxNameVars[fileNameMatches[2]] : replaceAll(fileNameMatches[4], "/", "_")

                        if (classNameCache[modIndex + className]) console.log("jdhooks: duplicated class table item", modIndex + className, classNameCache[modIndex + className], classReadableName)
                        classNameCache[`${className}_${modIndex}`] = classReadableName
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
                if (moduleSignatures[moduleName].signature.every(i => -1 < fntxt.indexOf(i))) {
                    found = AddAndCheck(modIndex, moduleName)
                    if (moduleSignatures[moduleName].exports)
                        jdhooks._moduleMap[moduleName].exports = moduleSignatures[moduleName].exports
                    if (fastProcessModules) {
                        delete moduleSignatures[moduleName]
                        break
                    }
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
            req = mod => {
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
                                        let className = classNameCache[`${type.name}_${type.prototype.jdhooks_module_index}`]
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

        for (const moduleIndex in modules_list) {
            let oldfn = modules_list[moduleIndex]
            modules_list[moduleIndex] = (moduleInfo, exports, require) => {
                oldfn(moduleInfo, exports, overrideRequire(require, moduleIndex))
            }
        }

        //wait for UI
        hookModuleExport("_RazerChroma", "default", oldExports => {
            return {
                ...oldExports,
                init: () => {
                    document.dispatchEvent(new Event(jdhooks_ui_ready_event))
                    oldExports.init()
                }
            }
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

                jdhooks.require = function req(module, exportName = "default") {
                    //returns exports as is if "module" argument is a number
                    if ("number" === typeof module) return nrequire(module)

                    let moduleMap = jdhooks._moduleMap[module]

                    //unknown module name
                    if (!moduleMap) throw `jdhooks.require: unknown module ${module}`

                    const retValue = nrequire(moduleMap.idx)

                    //returns exports as is if module exports non object value
                    if (typeof retValue !== "object") return retValue

                    if (moduleMap.cached && moduleMap.cached[exportName]) return moduleMap.cached[exportName].get(retValue)

                    const getFn = trySignatures(module, exportName, retValue)
                    if (getFn) return getFn.get(retValue)

                    throw `jdhooks.require: cannot find export ${exportName} for module ${module}`
                }

                jdhooks_module_step2(startupModule, modules_list)
                loadHooks(_ => nrequire("newStartup")) //run
                break
            }
        }
    }

    window.webpackJsonp.push([[0], { [jdhooks_module_index]: jdhooks_module_step1 }, [[jdhooks_module_index]]])
})()
