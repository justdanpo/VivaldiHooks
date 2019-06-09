//var result = vivaldi.jdhooks.require(moduleName)
//vivaldi.jdhooks.hookMember(object, memberName, function(hookData, {oldarglist}), function(hookData, {oldarglist}))
//vivaldi.jdhooks.hookModule(moduleName, function(moduleInfo, exportsInfo))
//vivaldi.jdhooks.hookSettingsWrapper(moduleName, function(constructor, settingsArray))
//vivaldi.jdhooks.onUIReady(function())

(function () {
    const jdhooks_module_index = 'jdhooks_module'
    const jdhooks_ui_ready_event = 'jdhooks.uiready'

    const fastProcessModules = true

    vivaldi.jdhooks = {}

    //---------------------------------------------------------------------
    //API

    //hookModule(moduleName, function(moduleInfo))
    const hookModule = vivaldi.jdhooks.hookModule = (moduleName, newfn) => {
        const moduleIndex = vivaldi.jdhooks._moduleMap[moduleName]
        const oldfn = vivaldi.jdhooks._modules[moduleIndex]
        vivaldi.jdhooks._modules[moduleIndex] = (moduleInfo, exports, nrequire) => {
            oldfn(moduleInfo, exports, nrequire)

            if (moduleInfo.exports.hasOwnProperty("a"))
                newfn(moduleInfo, {
                    exports: moduleInfo.exports.a,
                    parent: moduleInfo.exports,
                    name: "a"
                })
            else if (moduleInfo.exports.hasOwnProperty("default"))
                newfn(moduleInfo, {
                    exports: moduleInfo.exports.default,
                    parent: moduleInfo.exports,
                    name: "default"
                })
            else
                newfn(moduleInfo, {
                    exports: moduleInfo.exports,
                    parent: moduleInfo,
                    name: "exports"
                })
        }
    }

    //hookMember(object, memberName, function(hookData,oldarglist), function(hookData,oldarglist))
    const hookMember = vivaldi.jdhooks.hookMember = function (obj, memberName, cbBefore = null, cbAfter = null) {
        if (!obj.hasOwnProperty(memberName))
            throw "jdhooks.hookMember: wrong member name " + memberName

        const oldMember = obj[memberName]
        obj[memberName] = function () {

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

            hookData.retValue = oldMember.apply(this, hookData.arguments)

            if (cbAfter)
                hookData.retValue = cbAfter.apply(this, args)

            return hookData.retValue
        }
    }

    //vivaldi.jdhooks.hookSettingsWrapper(moduleName, function(constructor, settingsArray))
    let hookSettingsWrapperList = {}
    const hookSettingsWrapper = vivaldi.jdhooks.hookSettingsWrapper = (moduleName, cb) => {
        const moduleIndex = vivaldi.jdhooks._moduleMap[moduleName]
        hookSettingsWrapperList[moduleIndex] = hookSettingsWrapperList[moduleIndex] || []
        hookSettingsWrapperList[moduleIndex].push(cb)
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

            let hooksItem = outerDirItems.find(_ => _.isDirectory && _.name == "hooks")

            if (!hooksItem) {
                checkFinished()
            } else
                hooksItem.createReader().readEntries(dirItems => {

                    chrome.storage.local.get("JDHOOKS_STARTUP", function (cfg) {
                        if (undefined === cfg.JDHOOKS_STARTUP) cfg.JDHOOKS_STARTUP = {}
                        if (undefined === cfg.JDHOOKS_STARTUP.defaultLoad) cfg.JDHOOKS_STARTUP.defaultLoad = true
                        if (undefined === cfg.JDHOOKS_STARTUP.scripts) cfg.JDHOOKS_STARTUP.scripts = {}

                        vivaldi.jdhooks._hooks = {}

                        for (let i in dirItems) {
                            let dirItem = dirItems[i]

                            let fileExt = dirItem.name.split('.').pop().toUpperCase()

                            if ((fileExt !== "JS") && (fileExt !== "CSS"))
                                continue

                            let shouldBeLoaded = undefined === cfg.JDHOOKS_STARTUP.scripts[dirItem.name] ? cfg.JDHOOKS_STARTUP.defaultLoad : cfg.JDHOOKS_STARTUP.scripts[dirItem.name]
                            if (dirItem.name === "jdhooks-startup-settings.js") shouldBeLoaded = true

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

    function makeSignatures() {
        const jsxNames = {
            "ActionLog": "ActionLog.jsx",
            "Appearance": "Appearance.jsx",
            "AudioIcon": "AudioIcon.jsx",
            "BlockedContentNotificator": "BlockedContentNotificator.jsx",
            "BookmarkEditor": "BookmarkEditor.jsx",
            "BookmarksFoldersFlatList": "bookmarksfoldersflatlist.jsx",
            "BookmarksPanel": "BookmarksPanel.jsx",
            "BookmarkTree": "BookmarkTree.jsx",
            "ConfirmationDlg": "ConfirmationDlg.jsx",
            "Countdown": "Countdown.jsx",
            "CreateBookmark": "createbookmark.jsx",
            "DevTools": "devTools.jsx",
            "DownloadPanel": "DownloadPanel.jsx",
            "DownloadPanelHeader": "DownloadPanelHeader.jsx",
            "EditSearchEngine": "EditSearchEngine.jsx",
            "Favicon": "Favicon.jsx",
            "FindInPage": "find-in-page.jsx",
            "FloatingLabel": "FloatingLabel.jsx",
            "FocusTrap": "FocusTrap.jsx",
            "FolderIcon": "FolderIcon.jsx",
            "HistorySearch": "HistorySearch.jsx",
            "HistoryStoreSubscription": "HistoryStoreSubscription.jsx",
            "ImportBookmarks": "importBookmarks.jsx",
            "InsertPrefsCache": "InsertPrefsCache.jsx",
            "MasterDetail": "MasterDetail.jsx",
            "Modal": "Modal.jsx",
            "MouseGestures": "MouseGestures.jsx",
            "NotesPanel": "notesPanel.jsx",
            "NotesTree": "notesTree.jsx",
            "PageloadProgress": "PageloadProgress.jsx",
            "QuickCommandSearch": "QuickCommandSearch.jsx",
            "RadioGroup": "RadioGroup.jsx",
            "ReaderModeControls": "ReaderModeControls.jsx",
            "RSSFeedDropdown": "RSSFeedDropdown.jsx",
            "SearchEngines": "SearchEngines.jsx",
            "SearchEngineSelect": "SearchEngineSelect.jsx",
            "SearchField": "searchfield.jsx",
            "SettingsSearchCategory": "SettingsSearchCategory.jsx",
            "SetVivaldiDefaultSettings": "SetVivaldiDefaultSettings.jsx",
            "SiteInfoButton": "SiteInfoButton.jsx",
            "SlideBar": "SlideBar.jsx",
            "SortingSelector": "SortingSelector.jsx",
            "StatusInfo": "StatusInfo.jsx",
            "Sync": "Sync.jsx",
            "SyncConfigure": "SyncConfigure.jsx",
            "SyncedTabs": "SyncedTabs.jsx",
            "SyncPromptDecryptionPassword": "SyncPromptDecryptionPassword.jsx",
            "SyncPromptEncryptionPassword": "SyncPromptEncryptionPassword.jsx",
            "TabBar": "TabBar.jsx",
            "TabStrip": "TabStrip.jsx",
            "Thumbnail": "Thumbnail.jsx",
            "TitleBar": "titlebar.jsx",
            "Tooltip": "Tooltip.jsx",
            "TopMenu": "TopMenu.jsx",
            "Trash": "Trash.jsx",
            "TreeItem": "TreeItem.jsx",
            "TypedHistory": "typedhistory.jsx",
            "UIZoomIndicator": "UIZoomIndicator.jsx",
            "UrlBar": "urlbar.jsx",
            "UrlField": "urlfield.jsx",
            "VivaldiCommunityLinks": "VivaldiCommunityLinks.jsx",
            "VivaldiSettingsWrapper": "InsertVivaldiSettings.jsx",
            "VivaldiTreeList": "VivaldiTreeList.jsx",
            "WebPageCollection": "WebPageCollection.jsx",
            "WebPageContent": "WebPageContent.jsx",
            "WindowBackgroundImage": "WindowBackgroundImage.jsx",
            "WindowIcon": "WindowIcon.jsx",
            "WindowPanel": "WindowPanel.jsx",
            "WindowTree": "WindowTree.jsx",
            "ZoomIndicator": "ZoomIndicator.jsx",
        }

        const moduleSignatures = {
            "_BookmarkBarActions": ["setBookmarkBarFolder:"],
            "_getPrintableKeyName": ['"BrowserForward"', '"PrintScreen"'],
            "_KeyCodes": ["KEY_CANCEL:"],
            "_PageZoom": ["onUIZoomChanged.addListener"],
            "_ShowUI": ['document.getElementById("app")', "JS init startup"],
            "_UIActions": ["showConfirmOpenBookmarkDialog:"],
            "_WindowActions": [".windowPrivate.onMaximized"],

            // "_svg_addressbar_btn_backward": ["M17.6 20.4l-1.6 1.6-9-9 9-9 1.6 1.6-7.2 7.4 7.2 7.4z"],
            // "_svg_addressbar_btn_fastbackward": ["M19 6l-7 5.6v-5.6h-2v12h2v-5.6l7 5.6z"],
            // "_svg_addressbar_btn_fastforward": ["M10 6l7 5.6v-5.6h2v12h-2v-5.6l-7 5.6z"],
            // "_svg_addressbar_btn_forward": ["M15.2 13l-7.2 7.4 1.6 1.6 9-9-9-9-1.6 1.6 7.2 7.4z"],
            // "_svg_addressbar_btn_home": ["10h3.5v8h14v-8h3.5l-10.5-10zm5 16h-3v-5h-4v5h-3v"],
            // "_svg_addressbar_btn_reload": ["M4 13c0 4.95 4.05 9 9 9 4.162 0 7.65-2.924 8.662-6.75h-2.362c-.9 2"],
            // "_svg_addressbar_btn_reload_stop": ["M9.4 18l-1.4-1.4 4.6-4.6-4.6-4.6 1.4-1.4 4.6 4.6 4.6-4.6 1.4 1.4-4.6 4.6 "],
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
            // "_svg_menu_vivaldi": ["M10.428 5.038c-.42-.85.027-1.804.943-2.008.747-.167 1.518.386 1.617"],
            "_svg_notes_add_attachment": [".436.28.97.7.97h5.95c.98 0 1.75-1.043 1.75-2.06 0-1.02-.77-1.82-1.75"],
            // "_svg_notes_happynote": ['id="eye"'],
            // "_svg_pageactionchooser": ["M5.3 9.8L.8 6.5l4.6-3.3L6.6 5 4.2 6.4l2.3 1.7-1.2 1.6M10.7"],
            // "_svg_panel_bookmarks": ["v-11h8v11l-4"],
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
            "_svg_window_close": ["0h2v1H6V2zm1-1h2v1H7V1zM3"],
            "_svg_window_close_mac": ["window-close-glyph dpi-standard"],
            "_svg_window_close_win10": ["M10.2.5l-.7-.7L5 4.3.5-.2l-.7.7L4.3"],
            "_svg_window_minimize": ["M1 7h8v2H1z"],
            "_svg_window_minimize_mac": ["window-minimize-glyph dpi-standard"],
            "_svg_window_minimize_win10": ["M0 0h10v1H0z"],
            "_svg_window_zoom": ["7h10v1H0V8zm0-6h1v6H0V2zm9"],
            "_svg_window_zoom_mac": ["window-zoom-glyph dpi-standard"],
            "_svg_window_zoom_win10": ["0H2v2H0v8h8V8h2V0H3zm4"],
            //todo:
            // "_svg_notes_tree_note": ["2h10v12h-10v-12zm1 2h8v9h-8v-9zm1"],
            // "_svg_notes_tree_note_has_url": ["M13 8v-6h-10v12h7v2l2.5-2"],
            // "_svg_vivaldi_horizontal_menu": ['id="horizontal-menu-button'],
            // "_svg_vivaldi_title": ['id="vivrect1"'],
            // "_svg_vivaldi_v": ["M14.726 7.446c-.537-1.023.035-2.164 1.2-2.41.948-.2"],
        }

        vivaldi.jdhooks._moduleMap = {}
        const slashre = new RegExp("\\\\\\\\", 'g')

        for (const modIndex in vivaldi.jdhooks._modules) {
            let found = false

            function AddAndCheck(modIndex, moduleName) {
                if (("undefined" !== typeof vivaldi.jdhooks._moduleMap[moduleName]) && (vivaldi.jdhooks._moduleMap[moduleName] != modIndex))
                    console.log('jdhooks: repeated module name "' + moduleName + '"')

                vivaldi.jdhooks._moduleMap[moduleName] = modIndex
                //vivaldi.jdhooks._moduleNames[modIndex] = moduleName
                return true
            }

            const fntxt = vivaldi.jdhooks._modules[modIndex].toString()
            const fntxtPrepared = fntxt.replace(slashre, "/").toLowerCase()


            for (const jsxModuleName in jsxNames) {
                if (-1 !== fntxtPrepared.indexOf(jsxNames[jsxModuleName].toLowerCase())) {
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
                if (!vivaldi.jdhooks._moduleMap[moduleName]) {
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

        vivaldi.jdhooks._modules = modules_list
        makeSignatures()

        let callStack = []
        for (const moduleIndex in modules_list) {
            (function (moduleIndex, oldfn) {
                modules_list[moduleIndex] = function (moduleInfo, exports, require) {
                    callStack.push(moduleInfo.i)
                    oldfn(moduleInfo, exports, require)
                    callStack.pop()
                }
            })(moduleIndex, modules_list[moduleIndex])
        }

        vivaldi.jdhooks.hookModule("VivaldiSettingsWrapper", (moduleInfo, exportsInfo) =>
            vivaldi.jdhooks.hookMember(exportsInfo.parent, exportsInfo.name, (hookData, fn, settingsKeys) => {
                const hookCallbacks = hookSettingsWrapperList[callStack[callStack.length - 1]] || []
                hookCallbacks.forEach(cb => cb(fn, settingsKeys))
            })
        )

        //wait for UI
        hookModule("_BookmarkBarActions", (moduleInfo, exportsInfo) =>
            vivaldi.jdhooks.hookMember(exportsInfo.exports, "loadPromise",
                (hookData, cat) => document.dispatchEvent(new Event(jdhooks_ui_ready_event)))
        )
    }

    function jdhooks_module_step1(moduleInfo, exportsInfo, nrequire) {

        let cl = arguments.callee
        while (cl.caller != null) cl = cl.caller
        let match = cl.toString().match(/\.\s*push\s*\(\s*\[\s*(\d+)/m)
        if (null == match) return
        let startupModule = Number(match[1])

        for (let propertyName in nrequire) {
            if (nrequire[propertyName] && nrequire[propertyName][jdhooks_module_index] && nrequire[propertyName][jdhooks_module_index].name) {
                let modules_list = nrequire[propertyName]

                vivaldi.jdhooks.require = function (module) {
                    let retValue = null

                    if ("number" === typeof module) retValue = nrequire(module)
                    else {
                        if ("undefined" === typeof vivaldi.jdhooks._moduleMap[module])
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
