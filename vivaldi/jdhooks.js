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

            const keys = Object.keys(moduleInfo.exports).join(",")
            if (keys === "a") {
                moduleInfo.exports = { ...moduleInfo.exports, ...{ a: newfn(moduleInfo, moduleInfo.exports.a) } }
            }
            else if (keys === "default") {
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
            "BookmarkActions": ["Error removing bookmark tree:"],
            "buffer": ["The buffer module from node.js, for the browser"],
            "charenc": ["stringToBytes(unescape(encodeURIComponent("],
            "chroma.js": ["chroma.js"],
            "classnames": ["jedwatson.github.io/classnames"],
            "CommandActions": ["commandChanged", "restoreCommandGestures", "executeActions"],
            "core-js-internals-a-function": ['" is not a function!"'],
            "core-js-internals-an-object": ['" is not an object!"'],
            "core-js-internals-classof-raw": [").slice(8,", "{}.toString"],
            "core-js-internals-classof": ['"toStringTag"', '"Arguments"'],
            "core-js-internals-create-iterator-constructor": ['" Iterator")', ')("iterator"),'],
            "core-js-internals-define-iterator": ['"@@iterator"', '" Iterator"', "Object.prototype"],
            "core-js-internals-descriptors": ["Object.defineProperty({},", "return 7"],
            "core-js-internals-document-create-element": [").document,", ".createElement)", ".createElement("],
            "core-js-internals-enum-bug-keys": ["constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf"],
            "core-js-internals-global": ['"return this"', "window.Math"],
            "core-js-internals-html": ["document.documentElement", ").document"],
            "core-js-internals-ie8-dom-define": ["Object.defineProperty(", ')("div"),'],
            "core-js-internals-indexed-object": ['Object("z").propertyIsEnumerable(0)'],
            "core-js-internals-internal-metadata": ["KEY:", "onFreeze:"],
            "core-js-internals-is-array": ["Array.isArray", '"Array"'],
            "core-js-internals-microtask": [".WebKitMutationObserver", ".domain"],
            "core-js-internals-object-assign": ['"abcdefghijklmnopqrst"', "Symbol()"],
            "core-js-internals-object-create": [')("IE_PROTO")', ')("iframe"),'],
            "core-js-internals-object-define-property": ['TypeError("Accessors not supported!")'],
            "core-js-internals-object-get-own-property-descriptor": ["Object.getOwnPropertyDescriptor", ".f.call("],
            "core-js-internals-object-get-own-property-names-external": ["Object.getOwnPropertyNames(window)"],
            "core-js-internals-object-get-own-property-names": [').concat("length",', "Object.getOwnPropertyNames"],
            "core-js-internals-object-get-prototype-of": [')("IE_PROTO")', "Object.getPrototypeOf"],
            "core-js-internals-require-object-coercible": ["TypeError(\"Can't call method on  \""],
            "core-js-internals-set-species": [')("species")', "configurable:"],
            "core-js-internals-set-to-string-tag": [')("toStringTag")', "configurable:", "value:"],
            "core-js-internals-shared": ['["__core-js_shared__"]', "{}"],
            "core-js-internals-species-constructor": ['"species"', ").constructor"],
            "core-js-internals-string-multibyte": ["String(", ".charCodeAt(", "55296", ".charAt("],
            "core-js-internals-task": ['"onreadystatechange"', ".importScripts"],
            "core-js-internals-to-primitive": ["Can't convert object to primitive value"],
            "core-js-internals-uid": ['"Symbol(".concat(', ").toString(36))"],
            "core-js-internals-well-known-symbol": ['"Symbol."', ").Symbol"],
            "core-js-modules-es_array_iterator": [".Arguments", '"Array"', '"entries"'],
            "core-js-modules-es_promise": ["Promise can't be resolved itself"],
            "core-js-modules-es_string_iterator": [")(String,", '"String",', "done:"],
            "core-js-modules-es_symbol": ['"Symbol is not a constructor!"', "getOwnPropertySymbols:"],
            "createDOMPurify": ["TrustedTypes policy", '"beforeSanitizeElements"'],//DOMPurify
            "date-fns-build_format_locale": ["formattingTokensRegExp:", '"Tuesday"'],
            "date-fns-distance_in_words": ['"less than {{count}} seconds"'],
            "date-fns-format": ['"YYYY-MM-DDTHH:mm:ss.SSSZ"', ".format.formattingTokensRegExp"],
            "date-fns-get_days_in_month": [".getFullYear()", ".getMonth()", "new Date(0)", ".getDate()"],
            "date-fns-getTimezoneOffsetInMilliseconds": [".getTime())", ".getTimezoneOffset()", ".setSeconds(0,"],
            "date-fns-is_valid": ['" is not an instance of Date"'],
            "date-fns-parse": ["\/^(\\d{2}):?(\\d{2}):?(\\d{2}([.,]\\d*)?)$\/"],
            "dom-helpers-addClass": [".classList.add(", ".default)(", ".className"],
            "dom-helpers-removeClass": ["\" \").replace(\/^\\s*|\\s*$\/g,"],
            "DownloadActions": ["_setSearchFilter", '"restartDownload"'],
            "EventEmitter": ["Possible EventEmitter memory leak detected"],
            "expr-eval": ['"IEXPR"', "with(this.functions) with (this.ternaryOps) with (this.binaryOps) with (this.unaryOps) { return"],
            "highlight.js-languages-apache": ["keywords:", '"order deny allow setenv rewriterule rewriteengine rewritecond documentroot '],
            "highlight.js-languages-applescript": ["keywords:", '"AppleScript false linefeed return'],
            "highlight.js-languages-bash": ["keywords:", '"if then else elif fi for'],
            "highlight.js-languages-basic": ["keywords:", '"ABS ASC AND ATN AUTO|0'],
            "highlight.js-languages-coffeescript": ["keywords:", '"//[gim]*"'],
            "highlight.js-languages-cpp": ["keywords:", '"int float while private'],
            "highlight.js-languages-css": ["keywords:", 'selector-id', "/#[A-Za-z0-9_-]+/"],
            "highlight.js-languages-diff": ["\/^\\*\\*\\* +\\d+,\\d+ +\\*\\*\\*\\*$\/"],
            "highlight.js-languages-django": [".COMMENT(\/\\{%\\s*comment\\s*%}\/"],
            "highlight.js-languages-dockerfile": ["keywords:", '"from maintainer expose env arg user onbuild stopsignal'],
            "highlight.js-languages-dos": ["keywords:", '"if else goto for in do call exit not exist'],
            "highlight.js-languages-ini": ["\/\\bon|off|true|false|yes|no\\b\/"],
            "highlight.js-languages-java": ["keywords:", '"jsp"'],
            "highlight.js-languages-javascript": ["keywords:", '"js"'],
            "highlight.js-languages-json": ["keywords:", '"true false null"', '"{"', '"attr"'],
            "highlight.js-languages-less": ["beginKeywords:", "(url|data-uri)\\\\("],
            "highlight.js-languages-markdown": ["excludeBegin:", '"mkdown"'],
            "highlight.js-languages-mathematica": ["keywords:", '"mma"'],
            "highlight.js-languages-matlab": ["keywords:", '"break case catch classdef continue else elseif end enumerated'],
            "highlight.js-languages-nginx": ["keywords:", '"on off yes no true false none blocked debug'],
            "highlight.js-languages-objectivec": ["keywords:", '"int float while char export sizeof typedef const'],
            "highlight.js-languages-perl": ["keywords:", '"getpwent getservent quotemeta msgrcv scalar kill'],
            "highlight.js-languages-python": ["keywords:", '"and elif is global as in if from raise for except'],
            "highlight.js-languages-ruby": ["keywords:", '"and then defined module in return redo if BEGIN'],
            "highlight.js-languages-scss": ["keywords:", "whitespace|wait|w-resize|visible|vertical-text|vertical-ideographic"],
            "highlight.js-languages-shell": ["subLanguage:", '"console"'],
            "highlight.js-languages-sql": ["keywords:", '"begin end start commit rollback savepoint lock alter'],
            "highlight.js-languages-swift": ["keywords:", "__COLUMN__ __FILE__ __FUNCTION__ __LINE__"],
            "highlight.js-languages-typescript": ["keywords:", '"ts"'],
            "highlight.js-languages-vim": ["keywords:", '"N|0 P|0 X|0 a|0 ab abc abo al am an'],
            "highlight.js-languages-xml": ["subLanguage:", '"html"', '"rss"'],
            "highlight.js": ["initHighlightingOnLoad", "highlight|plain|text"],
            "HistoryActions": ["saveStateFromSearchQuery", "VIVALDI_HISTORY_DISPLAY_MODE_CHANGE"],
            "immutability-helper-update": ["update(): You provided an invalid spec to update()"],
            "immutable-devtools": ["@@__IMMUTABLE_RECORD__@@", "OrderedMapFormatter"],
            "immutable": ["@@__IMMUTABLE_ITERABLE__@@", '"@@iterator"', "__immutablehash__"],
            "keyMirror": ["keyMirror(...): Argument must be an object."],
            "lodash-memoize": ['new TypeError("Expected a function")', ".Cache", ".apply(this,"],
            "lodash": ['"lodash"', "filter|find|map|reject"],
            "moment.js": ["use moment.updateLocale"],
            "net": [".createServer", ".createConnection"],//dummy; used by stomp
            "node-crypt": ["rotl:", "hexToBytes:"],
            "normalize-url": ["removeQueryParameters:", "stripWWW:"],
            "NoteActions": ["createNotesFromTreeNodes", '"NotesCutIds"'],
            "Object.Assign": ["Object.assign cannot be called with null or undefined"],
            "PageActions": ["ERROR while creating new tab. Original message"],
            "PanelActions": ["setPanelResizable", '"PANEL_SHOW_CONTENT"'],
            "PrefsCache": ["Unknown prefs property:"],
            "process": ["process.binding is not supported"],
            "prop-types-factoryWithTypeCheckers": [".checkPropTypes", "Read more at http://fb.me/use-check-prop-types"],
            "prop-types-ReactPropTypesSecret": ['"SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED"'],
            "punycode": ['"Overflow: input needs wider integers to process",'],
            "react-css-transition-replace": ["string refs are not supported on children of ReactCSSTransitionReplace"],
            "react-dnd-decorators-DragDropContext": ['"DragDropContext"', '"backend"'],
            "react-dnd-decorators-DragDropContextProvider": ['DragDropContextProvider', '"DragDropContextProvider backend and window props must not change."'],
            "react-dnd-decorators-DragLayer": ['"DragLayer"', '"getDecoratedComponentInstance"'],
            "react-dnd-decorators-DragSource": ['"DragSource"', "containerDisplayName:"],
            "react-dnd-decorators-DropTarget": ['"DropTarget"', "containerDisplayName"],
            "react-dnd-dnd-core-createTestBackend": ['"simulateDrop"', '"simulateEndDrag"'],
            "react-dnd-dnd-core-DragDropManager": ["getBackend", "getMonitor", "getRegistry", "backend.teardown"],
            "react-dnd-dnd-core-DragDropMonitor": ['"canDragSource"', "handlerIds, when specified, must be an array of strings"],
            "react-dnd-dnd-core-HandlerRegistry": ["Cannot parse handler ID:", '"unpinSource"'],
            "react-dnd-dnd-core": ['"DragDropManager"', '"DragSource"'],
            "react-dnd-html5-backend-BrowserDetector": ["/firefox/i.test(navigator.userAgent)"],
            "react-dnd-html5-backend-EnterLeaveCounter": ['"enter"', "document.documentElement.contains("],
            "react-dnd-html5-backend-getEmptyImage": ["data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="],
            "react-dnd-html5-backend-MonotonicInterpolant": ["this.c3s", '"interpolate"'],
            "react-dnd-html5-backend-NativeDragSources": ['"mutateItemByReadingDataTransfer"'],
            "react-dnd-html5-backend-OffsetUtils": [".getNodeClientOffset", '"IMG"'],
            "react-dnd-html5-backend": [".__isReactDndBackendSetUp"],
            "react-dnd": ['"DragDropContext"', '"DragDropContextProvider"'],
            "react-mosaic-buttons-defaultToolbarControls": ["DEFAULT_CONTROLS_WITH_CREATION", "createElement", ".ReplaceButton", ".ExpandButton"],
            "react-mosaic-buttons-ExpandButton": ["ExpandButton", '"pt-icon-maximize"'],
            "react-mosaic-buttons-MosaicButton": ["createDefaultToolbarButton", "mosaic-default-control pt-button pt-minimal"],
            "react-mosaic-buttons-RemoveButton": ["RemoveButton", '"Close Window"'],
            "react-mosaic-buttons-ReplaceButton": ["ReplaceButton", '"Replace Window"'],
            "react-mosaic-buttons-Separator": ["Separator", "SeparatorFactory", '"separator"'],
            "react-mosaic-buttons-SplitButton": ["SplitButton", '"Split Window"'],
            "react-mosaic-contextTypes": ["MosaicContext", ".func.isRequired"],
            "react-mosaic-Mosaic": ["MosaicFactory", "mosaic mosaic-drop-target"],
            "react-mosaic-MosaicDropTarget": [".MosaicDropTarget", "connectDropTarget:", '("drop-target",'],
            "react-mosaic-MosaicDropTargetPosition": [".MosaicDropTargetPosition", "TOP:"],
            "react-mosaic-MosaicRoot": [".MosaicRoot", '"mosaic-root"'],
            "react-mosaic-MosaicWindow": ["MosaicWindowFactory", "SourceConnectedInternalMosaicWindow"],
            "react-mosaic-MosaicZeroState": ["MosaicZeroState", "mosaic-zero-state pt-non-ideal-state"],
            "react-mosaic-RootDropTargets": [".RootDropTargets", '"drop-target-container"'],
            "react-mosaic-types": ["MosaicDragType", '"MosaicWindow"'],
            "react-mosaic-util-mosaicUpdates": ["buildSpecFromUpdate", "splitPercentage"],
            "react-mosaic-util-mosaicUtilities": ["createBalancedTreeFromLeaves", "did not resolve to a node"],
            "react-mosaic": ["MosaicFactory", "MosaicActionsPropType"],
            "react-motion": ["startAnimationIfNecessary", "lastIdealVelocity"],
            "react-transition-group-Transition": [".prototype.performEnter", ".prototype.onTransitionEnd"],
            "react-transition-group-TransitionGroup": [".childContextTypes", '"childFactory"', '"div"'],
            "react-virtualized": ["ReactVirtualized__Grid", "__reactInternalSnapshotFlag"],
            "React": ["react.production."],
            "ReactDOM": ["react-dom.production."],
            "Readability": ["First argument to Readability constructor should be a document object."],
            "remarkable-common-entities": ["zwnj:", "RuleDelayed:"],
            "remarkable-common-html_blocks": ['["article"', '"video"].forEach'],
            "remarkable-common-html_re": ["r(\/(?:unquoted|single_quoted|double_quoted)\/)(\"unquoted\""],
            "remarkable-common-url_schemas": ['"coap"', '"h323"'],
            "remarkable-configs-commonmark": ["langPrefix:", '"abbr2"]'],
            "remarkable-configs-default": ["langPrefix:", '"footnote_tail"]'],
            "remarkable-configs-full": ["langPrefix:", "{}"],
            "remarkable-helpers-normalize_link": ["decodeURI(", "encodeURI(", "replaceEntities"],
            "remarkable-helpers-normalize_reference": ["trim().replace(/\\s+/g", ".toUpperCase()"],
            "remarkable-helpers-parse_link_destination": [".unescapeMd", ".parser.validateLink"],
            "remarkable-helpers-parse_link_label": [".labelUnmatchedScopes", "91", "93"],
            "remarkable-helpers-parse_link_title": [".unescapeMd", ".linkContent", "34", "39"],
            "remarkable-linkify": [".options.linkify", "/^mailto:/i"],
            "remarkable-parser_block": [".prototype.tokenize", '"blockquote"'],
            "remarkable-parser_core": ['"abbr"', '"abbr2"', ".prototype.process"],
            "remarkable-parser_inline": ["footnote_inline", ".tokenize"],
            "remarkable-renderer": [".renderInline", ".getBreak"],
            "remarkable-ruler": [".prototype.getRules", "Rules manager: invalid rule name"],
            "remarkable-rules": [".dt_close", '"paragraph_open"'],
            "remarkable-rules_block-blockquote": [".blkIndent", '"blockquote_open"'],
            "remarkable-rules_block-code": [".blkIndent", '"code"'],
            "remarkable-rules_block-deflist": [".blkIndent", '"dl_open"'],
            "remarkable-rules_block-fences": [".blkIndent", '"fence"'],
            "remarkable-rules_block-footnote": [".blkIndent", '"footnote"'],
            "remarkable-rules_block-heading": ['"heading_open"', ".skipCharsBack"],
            "remarkable-rules_block-hr": ['"hr"', ".eMarks"],
            "remarkable-rules_block-htmlblock": ['"htmlblock"', "\/^<([a-zA-Z]{1,15})[\\s\\\/>]\/"],
            "remarkable-rules_block-lheading": [".blkIndent", '"heading_open"'],
            "remarkable-rules_block-list": [".blkIndent", '"ordered_list_open"'],
            "remarkable-rules_block-paragraph": [".blkIndent", '"paragraph"', '"paragraph_close"'],
            "remarkable-rules_block-state_block": [".blkIndent", ".prototype.skipCharsBack"],
            "remarkable-rules_block-table": [".blkIndent", '"tbody_close"'],
            "remarkable-rules_core-abbr": [".inlineMode", ".abbreviations", 'paragraph_close'],
            "remarkable-rules_core-abbr2": [".env.abbreviations", ".env.abbrRegExp"],
            "remarkable-rules_core-block": [".block.parse", ".src.replace(/\\n/g,"],
            "remarkable-rules_core-footnote_tail": [".env.footnotes", ".env.footnotes.list", '"paragraph_close"'],
            "remarkable-rules_core-inline": [".inline.parse("],
            "remarkable-rules_core-references": [".references", 'indexOf("]:")'],
            "remarkable-rules_core-replacements": [".options.typographer", ".replace(/(^|[^-])---([^-]|$)/gm,"],
            "remarkable-rules_core-smartquotes": [".options.quotes["],
            "remarkable-rules_inline-autolink": ["parser.validateLink", "link_close"],
            "remarkable-rules_inline-backticks": ['"code"', ".src.charCodeAt"],
            "remarkable-rules_inline-del": [".options.maxNesting", '"del_close"'],
            "remarkable-rules_inline-emphasis": [".options.maxNesting", '"em_close"'],
            "remarkable-rules_inline-entity": ["\/^&#((?:x[a-f0-9]{1,8}|[0-9]{1,8}));\/i", ".isValidEntityCode"],
            "remarkable-rules_inline-escape": ['"hardbreak"', "\"\\\\!\\\"#$%&\'()*+,.\/:;<=>?@[]^_`{|}~-\".split(\"\")"],
            "remarkable-rules_inline-footnote_inline": ['"footnote_ref"', ".linkLevel++"],
            "remarkable-rules_inline-footnote_ref": [".options.maxNesting", ".env.footnotes.list.length", "32", "10"],
            "remarkable-rules_inline-htmltag": ['"htmltag"', ".HTML_TAG_RE"],
            "remarkable-rules_inline-ins": [".options.maxNesting", '"ins_close"'],
            "remarkable-rules_inline-links": ["options.maxNesting", ".linkLevel", '"image"', "parser.tokenize"],
            "remarkable-rules_inline-mark": [".options.maxNesting", '"mark_close"'],
            "remarkable-rules_inline-newline": ['"softbreak"', '"hardbreak"'],
            "remarkable-rules_inline-state_inline": [".prototype.cacheGet", ".prototype.pushPending"],
            "remarkable-rules_inline-sub": [".options.maxNesting", '"sub"'],
            "remarkable-rules_inline-sup": [".options.maxNesting", '"sup"'],
            "remarkable-rules_inline-text": ["case 10:", "case 123:", ".src.charCodeAt"],
            "remarkable-utils": ["\/\\\\([\\\\!\"#$%&\'()*+,.\\\/:;<=>?@[\\]^_`{|}~-])\/g;"],
            "remarkable": ["Wrong `remarkable` preset, check name/content"],
            "scheduler": ["scheduler.production."],
            "scrollIntoViewIfNeeded": ["Element is required in scrollIntoViewIfNeeded"],
            "SearchEngineActions": ["setDefaultForSpeedDial", '"SEARCH_ENGINE_COLLECTION"'],
            "setProgressState": ["setProgressState", '"PAGE_SET_PROGRESS"'],
            "Startup": ['document.getElementById("app")', "JS init startup"],
            "stomp-websocket-stomp-node": [".overTCP", ".overWS", '"tcp://"'],
            "stomp-websocket-stomp": ["v12.stomp"],
            "stomp-websocket": [".Stomp", ".exports.overTCP"],
            "SyncActions": ["setEncryptionPassword", '"SYNC_ENGINE_STATE_CHANGED"'],
            "TrashActions": ["Error restoring tab:", "undeletePreviousTab"],
            "turndown": ["is not a string, or an element/document/fragment node.", "turndown:"],
            "url": [".prototype.parseHost"],
            "velocity-react-velocity-animate-shim": [".velocityReactServerShim", 'navigator.userAgent.indexOf("Node.js")'],
            "velocity-react-velocity-component": ['"fxqueue"', "_clearVelocityCache"],
            "velocity-react-velocity-helpers": ['"VelocityHelper.animation."'],
            "velocity-react-velocity-transition-group": ["this._scheduledAnimationRunFrames.push("],
            "velocity-react": ['"VelocityComponent"', '"velocityHelpers"'],
            "velocity.js": ["VelocityJS.org"],
            "VivaldiAccountActions": ["VIVALDI_ACCOUNT_STATE_UPDATED", "vivaldiAccount.login"],
            "VivaldiFeatureFlags": ["Enabling feature failed:"],
            "vivaldiSettings": ["_vivaldiSettingsListener"],
            "webpack-buildin-module": ["Object.defineProperty(", '"loaded",', ".paths"],
            "webpack-runtime-GlobalRuntimeModule": ['new Function("return this")()'],
            "WebSocket-Node-browser": ["w3cwebsocket:", '"CONNECTING"'],
            "WindowActions": [".windowPrivate.onMaximized"],
            "yoga-layout": ["computeLayout:", "fillNodes:"],

            "_ActionList_DataTemplate": ["CHROME_SET_SESSION:", "CHROME_TABS_API:"],
            "_BookmarkStore": ["validateAsBookmarkBarFolder"],
            "_CommandManager": ['emitChange("shortcut")'],
            "_decodeDisplayURL": [".removeTrailingSlashWhenNoPath(", ".getDisplayUrl(", "decodeURI("],
            "_getLocalizedMessage": [".i18n.getMessage"],
            "_getPrintableKeyName": ['"BrowserForward"', '"PrintScreen"'],
            "_KeyCodes": ["KEY_CANCEL:"],
            "_MouseGesturesHandler": ["onMouseGestureDetection.addListener"],
            "_NavigationInfo": ["getNavigationInfo", "NAVIGATION_SET_STATE"],
            "_OnClickOutside": ["Component lacks a handleClickOutside(event) function for processing outside click events."],
            "_PageStore": ["section=Speed-dials&activeSpeedDialIndex=0"],
            "_PageZoom": ["onUIZoomChanged.addListener"],
            "_PrefKeys": ["vivaldi.downloads.update_default_download_when_saving_as"],
            "_PrefSet": ["Not known how to make event handler for pref "],
            "_ProgressInfo": ["getProgressInfo", "PAGE_SET_PROGRESS"],
            "_RazerChroma": ["Error setting Razer Chroma color"],
            "_ShowMenu": ["menubarMenu.onAction.addListener", "containerGroupFolders"],
            "_TabSetMediaState": ["static setMediaState", '"PAGE_SET_MEDIASTATE"'],
            "_Theme": ["fgBgHighlight", "kThemeContrastMinimum"],
            "_UIActions": ["_maybeShowSettingsInWindow"],
            "_UrlFieldActions": ["history.onVisitRemoved.addListener"],
            "_VivaldiIcons": ["small:", "medium:", "large:"],
            "_WebViewStore": ["getActiveWebView()", ".WEBVIEW_CLEAR_IF_ACTIVE:"],

            "_svg_addressbar_btn_backward": ["M15.2929 20.7071C15.6834 21.0976 16.3166 21.0976 16.7071 20.7071C17.0976 20.3166 17.0976"],
            "_svg_addressbar_btn_fastbackward": ["M9 8C9 7.44772 9.44772 7 10 7C10.5523 7 11 7.44772 11 8V12L15.2929 7.70711C15.9229"],
            "_svg_addressbar_btn_fastforward": ["M17 18C17 18.5523 16.5523 19 16 19C15.4477 19 15 18.5523 15 18L15"],
            "_svg_addressbar_btn_forward": ["M9.29289 19.2929C8.90237 19.6834 8.90237 20.3166 9.29289 20.7071C9.68342 21.0976 10.3166 21.0976 10"],
            "_svg_addressbar_btn_home": ["M14.0607 5.14645C13.4749 4.56066 12.5251 4.56066 11.9393 5.14645L5"],
            "_svg_addressbar_btn_reload": ["M20 6.20711C20 5.76166 19.4614 5.53857 19.1464 5.85355L17.2797 7.72031C16.9669 7.46165 16.632 7.22741"],
            "_svg_addressbar_btn_reload_stop": ["M8.70711 7.29289C8.31658 6.90237 7.68342 6.90237 7.29289 7.29289C6.90237 7.68342 6.90237"],
            "_svg_bookmarked": ['id="addBookmarkPath"'],
            "_svg_bookmarks_large": ["M16.2929 20.2929L13 17L9.70711 20.2929C9.07714 20.9229 8 20.4767 8 19.5858V6C8 5.44772 8.44772 5 9 5H17C17.5523 5 18 5.44772 18 6V19.5858C18 20"],
            "_svg_bookmarks_small": ["M5 2C4.44772 2 4 2.44772 4 3V13.5858C4 14.4767"],
            "_svg_bookmarks_update_thumbnail": ["M12.6 7C9.507 7 7 9.506 7"],
            "_svg_btn_delete": ["M13.5 6l-1.4-1.4-3.1 3-3.1-3L4.5"],
            "_svg_btn_minus": ["M4 8C4 8.55228 4.44772 9 5 9H11C11.5523 9 12 8.55228 12"],
            "_svg_btn_plus_large": ["M12 14H9C8.44772 14 8 13.5523 8 13V13C8 12.4477 8.44772 12 9 12H12V9C12"],
            "_svg_btn_plus_small": ["M7 7V5C7 4.44772 7.44772 4 8 4C8.55228 4 9 4.44772"],
            "_svg_button_restart": ["M13 13H6V6l7 7z"],
            "_svg_calendar_large": ["M21 9C21 7.89543 20.1046 7 19 7H18V6C18 5.44772 17.5523"],
            "_svg_calendar_medium": ["M4 1C3.44772 1 3 1.44772 3 2C1.89543 2 1 2.89543"],
            "_svg_calendar_small": ["M4 2C4 1.44772 4.44772 1 5 1C5.55228 1 6 1.44772"],
            "_svg_contacts_large": ["M15.3601 14.0944C15.7634 13.2763 16 12.3882 16 11.5V10.7C16 8.97393"],
            "_svg_contacts_small": ["M6.32251 9.83154L7.19854 9.13994C7.79551 8.66865 8.18182 7.93438"],
            "_svg_downloads_large": ["M11 6C11 5.44772 11.4477 5 12 5H14C14.5523 5 15"],
            "_svg_downloads_small": ["M2 9.99988H0V14.9998C0 15.5521 0.447715 15.9998"],
            "_svg_history_large": ["M5 13C5 11.1401 5 10.2101 5.20445 9.44709C5.75925 7.37653 7.37653 5.75925 9.44709"],
            "_svg_history_medium": ["M7 5.5C7 5.22386 7.22386 5 7.5 5H8.5C8.77614"],
            "_svg_history_small": ["M7.5 4C7.22386 4 7 4.22386 7 4.5V8C7 8.13807 7.05596"],
            "_svg_mail_large": ["m6.64645 7.64645c.19526-.19527.51184-.19527.7071"],
            "_svg_mail_small": ["M1.64645 2.64645C1.84171 2.45118 2.15829"],
            "_svg_menu_vivaldi": ["M10.9604 4.44569C10.4629 3.42529 10.9928 2.28123 12.0753 2.03561C12.9563 1.83607 13.8679 2.4994 13.9847 3.41546C14.0358 3.81793 13.958 4.18653 13.763 4"],
            "_svg_notes": ["M7 18C7 19.1046 7.89543 20 9 20H17C18.1046"],
            "_svg_notes_add_attachment": [".436.28.97.7.97h5.95c.98 0 1.75-1.043 1.75-2.06 0-1.02-.77-1.82-1.75"],
            "_svg_panel_downloads_btn_resume": ["M16 13l-6 5V8l6 5z"],
            "_svg_settings_category_mouse": ["M7.5 0c-3.025 0-5.5 2.314-5.5"],
            "_svg_settings_category_privacy": ["M8 13c3.636 0 6.764-2.067"],
            "_svg_settings_category_themes": ["M5.976 11c-1.92.537-1.91"],
            "_svg_sorting_selector_descending": ["M5.5.133l.11-.11 4.456"],
            "_svg_tabs_large": ["M21 8C21 6.89543 20.1046 6 19 6H7C5.89543"],
            "_svg_tabs_small": ["M1 4C1 2.89543 1.89543 2 3 2H13C14.1046 2 15 2.89543"],
            "_svg_tabstrip_btn_trashcan": ['"trashicon-content"'],
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
            "_svn_write_1": ["M13.414.5c-.398 0-.779.158-1.061.439l-1.061 1.061"],
            "_svn_write_2": ["M14.05 1.28a.96.96 0 00-1.35 0l-.68.67"],
            "_svn_write_3": ["M9 16h2.53l7-7.03-2.54-2.4L9 13.46V16zm11.8-9.33a.64.64"],
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
