//var result = vivaldi.jdhooks.require(moduleName)
//vivaldi.jdhooks.hookClass(className, function(class))
//vivaldi.jdhooks.hookMember(object, memberName, function(hookData, {oldarglist}), function(hookData, {oldarglist}))
//vivaldi.jdhooks.hookModule(moduleName, function(moduleInfo, exportsInfo))
//vivaldi.jdhooks.hookSettingsWrapper(moduleName, function(constructor, settingsArray))
//vivaldi.jdhooks.onUIReady(function())

(function() {

    const fastProcessModules = true;

    vivaldi.jdhooks = {};

    //---------------------------------------------------------------------
    //API

    //hookModule(moduleName, function(moduleInfo));
    var hookModule = vivaldi.jdhooks.hookModule = function(moduleName, newfn) {
        var moduleIndex = vivaldi.jdhooks._moduleMap[moduleName];
        var oldfn = vivaldi.jdhooks._modules[moduleIndex];
        vivaldi.jdhooks._modules[moduleIndex] = function(moduleInfo, exports, nrequire) {
            oldfn(moduleInfo, exports, nrequire);

            if (moduleInfo.exports.hasOwnProperty("a"))
                newfn(moduleInfo, {
                    exports: moduleInfo.exports.a,
                    parent: moduleInfo.exports,
                    name: "a"
                });
            else
            if (moduleInfo.exports.hasOwnProperty("default"))
                newfn(moduleInfo, {
                    exports: moduleInfo.exports.default,
                    parent: moduleInfo.exports,
                    name: "default"
                });
            else
                newfn(moduleInfo, {
                    exports: moduleInfo.exports,
                    parent: moduleInfo,
                    name: "exports"
                });
        }
    };

    //hookClass(className, function(class))
    var hookClassList = {};
    vivaldi.jdhooks._unusedClassHooks = {}; //stats

    var hookClass = vivaldi.jdhooks.hookClass = function(className, cb) {
        if ("undefined" === typeof hookClassList[className]) hookClassList[className] = [];
        hookClassList[className].push(cb);

        vivaldi.jdhooks._unusedClassHooks[className] = true;
    };

    //hookMember(object, memberName, function(hookData,oldarglist), function(hookData,oldarglist))
    var hookMember = vivaldi.jdhooks.hookMember = function(obj, memberName, cbBefore = null, cbAfter = null) {
        if (!obj.hasOwnProperty(memberName))
            throw "jdhooks.hookMember: wrong member name " + memberName;

        var oldMember = obj[memberName];
        obj[memberName] = function() {

            var abortHook = false;
            var hookData = {
                arguments: arguments,
                abort: function() {
                    abortHook = true
                }
            };

            var args = [].slice.call(hookData.arguments, 0);
            [].unshift.call(args, hookData);

            if (cbBefore)
                hookData.retValue = cbBefore.apply(this, args);

            if (abortHook)
                return hookData.retValue;

            hookData.retValue = oldMember.apply(this, hookData.arguments);

            if (cbAfter)
                hookData.retValue = cbAfter.apply(this, args);

            return hookData.retValue;
        };
    };

    //vivaldi.jdhooks.hookSettingsWrapper(moduleName, function(constructor, settingsArray))
    var hookSettingsWrapperList = {};
    var hookSettingsWrapper = vivaldi.jdhooks.hookSettingsWrapper = function(moduleName, cb) {
        var moduleIndex = vivaldi.jdhooks._moduleMap[moduleName];
        if ("undefined" === typeof hookSettingsWrapperList[moduleIndex]) hookSettingsWrapperList[moduleIndex] = [];
        hookSettingsWrapperList[moduleIndex].push(cb);
    }

    //onUIReady(function)
    vivaldi.jdhooks.onUIReady = function(cb) {
        document.addEventListener("jdhooks.uiready", cb);
    };

    //---------------------------------------------------------------------

    function loadHooks(callback) {
        chrome.runtime.getPackageDirectoryEntry(function(dir) {

                dir.createReader().readEntries(function(dirItems) {

                    var pendingscripts = {};

                    function checkFinished() {
                        if (0 === Object.keys(pendingscripts).length) {
                            //all scripts are a loaded
                            callback();
                        }
                    }

                    var dirItem = dirItems.find(function(dirItem) {
                        return dirItem.isDirectory && dirItem.name == "hooks"
                    });

                    if (!dirItem) {
                        checkFinished();
                    } else {
                        dirItem.createReader().readEntries(function(dirItems) {

                            chrome.storage.local.get("JDHOOKS_STARTUP", function(cfg) {
                                if (undefined === cfg.JDHOOKS_STARTUP) cfg.JDHOOKS_STARTUP = {};
                                if (undefined === cfg.JDHOOKS_STARTUP.defaultLoad) cfg.JDHOOKS_STARTUP.defaultLoad = true;
                                if (undefined === cfg.JDHOOKS_STARTUP.scripts) cfg.JDHOOKS_STARTUP.scripts = {};

                                vivaldi.jdhooks._hooks = {};

                                for (var i in dirItems) {
                                    var dirItem = dirItems[i];
                                    var Elem;

                                    var fileExt = dirItem.name.split('.').pop().toUpperCase();

                                    if ((fileExt !== "JS") && (fileExt !== "CSS"))
                                        continue;

                                    var shouldBeLoaded = undefined === cfg.JDHOOKS_STARTUP.scripts[dirItem.name] ? cfg.JDHOOKS_STARTUP.defaultLoad : cfg.JDHOOKS_STARTUP.scripts[dirItem.name];
                                    if (dirItem.name === "jdhooks-startup-settings.js") shouldBeLoaded = true;

                                    vivaldi.jdhooks._hooks[dirItem.name] = shouldBeLoaded;

                                    if (!shouldBeLoaded)
                                        continue;

                                    if (fileExt === "JS") {

                                        Elem = document.createElement("script");
                                        Elem.src = "hooks/" + dirItem.name;
                                        pendingscripts[Elem.src] = true;

                                        Elem.onload = function(e) {
                                            delete pendingscripts[this.src];
                                            checkFinished();
                                        };
                                    }

                                    if (fileExt === "CSS") {

                                        Elem = document.createElement("link");
                                        Elem.href = "hooks/" + dirItem.name;
                                        Elem.rel = "stylesheet";

                                    }

                                    document.head.appendChild(Elem);
                                }
                                checkFinished();
                            }); //storage get
                        });
                    }

                })
            }) //getPackageDirectoryEntry
    };

    //---------------------------------------------------------------------

    function makeSignatures() {
        var jsxNames = {
            "ApplySearchFilter": "applySearchFilter.js",

            "ActionItem": "page-actions/ActionItem.jsx",
            "ActionLog": "ActionLog.jsx",
            "AddressBar": "AddressBar.jsx",
            "AddressBarDropdown": "AddressBarDropdown.jsx",
            "AddWebPanelButton": "addWebPanelButton.jsx",
            "AttachmentContainer": "notesAttachmentContainer.jsx",
            "AttachmentItem": "notesAttachment.jsx",
            "AudioIcon": "AudioIcon.jsx",
            "autoupdate": "Autoupdate.jsx",
            "BackgroundTaskStatus": "BackgroundTaskStatus.jsx",
            "BackgroundTaskStatusList": "BackgroundTaskStatusList.jsx",
            "BiscuitSettings": "BiscuitMode.jsx",
            "BlockedContentNotificator": "BlockedContentNotificator.jsx",
            "BookmarkBar": "BookmarkBar.jsx",
            "BookmarkEditItem": "BookmarkEditItem.jsx",
            "BookmarksBar": "bookmarksbar.jsx",
            "BookmarksBarItem": "bookmarksbarItem.jsx",
            "BookmarkSettings": "BookmarkSettings.jsx",
            "BookmarksFoldersFlatList": "bookmarksfoldersflatlist.jsx",
            "BookmarksManager": "bookmarks-manager.jsx",
            "BookmarksPanel": "bookmarksPanel.jsx",
            "BookmarkTree": "BookmarkTree.jsx",
            "capture": "Capture.jsx",
            "CaptureImages": "CaptureImages.jsx",
            "ClearBrowsingHistory": "ClearBrowsingHistory.jsx",
            "ClearBrowsingHistoryDialog": "ClearBrowsingHistoryDialog.jsx",
            "ColorPicker": "ColorPicker.jsx",
            "ConfigureSingleKeyShortcut": "ConfigureSingleKeyShortcuts.jsx",
            "ConfirmationDlg": "ConfirmationDlg.jsx",
            "ConfirmOpenBookmarksDialog": "confirmOpenBookmarksDialog.jsx",
            "ContactPhotoPicker": "ContactPhotoPicker.jsx",
            "ContactsPanel": "ContactsPanel.jsx",
            "ContactTree": "ContactTree.jsx",
            "ContactView": "ContactView.jsx",
            "CookieItem": "CookieItem.jsx",
            "CookieManager": "cookieManager.jsx",
            "CookieManagerDialog": "cookieManagerDlg.jsx",
            "CookieSettings": "cookieSettings.jsx",
            "CreateBookmark": "createbookmark.jsx",
            "CreateSearchEngine": "createSearchEngine.jsx",
            "CreateSearchEngineDlg": "createSearchEngineDlg.jsx",
            "DefaultGlobalZoom": "defaultGlobalZoom.jsx",
            "DialogRenderWrapper": "dialogRenderWrapper.jsx",
            "dockedDevTools": "dockedDevTools.jsx",
            "DownloadDialog": "downloadDialog.jsx",
            "DownloadItem": "DownloadItem.jsx",
            "DownloadPanel": "DownloadPanel.jsx",
            "DownloadSettings": "downloads.jsx",
            "DownloadTree": "downloadTree.jsx",
            "ExperimentItem": "ExperimentItem.jsx",
            "Experiments": "experiments.jsx",
            "ExtensionActionItem": "ExtensionActionItem.jsx",
            "ExtensionActionPopup": "ExtensionActionPopup.jsx",
            "ExtensionActionToolbar": "ExtensionActionToolbar.jsx",
            "FindInPage": "find-in-page.jsx",
            "FocusTrap": "FocusTrap.jsx",
            "FolderIcon": "FolderIcon.jsx",
            "Fonts": "fonts.jsx",
            "FullKeyAccess": "FullKeyAccess.jsx",
            "FullscreenInfoBubble": "fullscreeninfobubble.jsx",
            "FullscreenSettings": "fullscreen.jsx",
            "HistoryFolder": "HistoryFolder.jsx",
            "HistoryItem": "history/HistoryItem.jsx",
            "HistoryManager": "HistoryManager.jsx",
            "HistoryMoreInfo": "HistoryMoreInfo.jsx",
            "HistoryPanel": "HistoryPanel.jsx",
            "HistorySearch": "HistorySearch.jsx",
            "HistorySetting": "HistorySetting.jsx",
            "HistoryStoreSubscription": "HistoryStoreSubscription.jsx",
            "HistoryTree": "HistoryTree.jsx",
            "HomePageSetting": "homePageSetting.jsx",
            "HueIntegration": "HueIntegration.jsx",
            "ImportBookmarks": "importBookmarks.jsx",
            "InfoBar": "InfoBar.jsx",
            "InsertThemeWrapper": "InsertTheme.jsx",
            "InternalPage": "InternalPage.jsx",
            "JavascriptDialog": "javascriptDialog.jsx",
            "Keyboard": "Keyboard.jsx",
            "LanguageSetting": "languageSetting.jsx",
            "LocationPermissionDialog": "locationPermissionDialog.jsx",
            "LocationPermissionNotificator": "locationPermissionNotificator.jsx",
            "MailAccountForm": "MailAccountForm.jsx",
            "MailAccountRemovalDlg": "MailAccountRemovalDlg.jsx",
            "MailAccountSaveDlg": "MailAccountSaveDlg.jsx",
            "MailBar": "MailBar.jsx",
            "MailBarComposer": "MailBarComposer.jsx",
            "MailBarList": "MailBarList.jsx",
            "MailComposer": "MailComposer.jsx",
            "MailCustomFlagDlg": "MailCustomFlagDlg.jsx",
            "MailDetail": "MailDetail.jsx",
            "MailEntryHorizontal": "MailEntryHorizontal.jsx",
            "MailEntryVertical": "MailEntryVertical.jsx",
            "MailFilterManager": "MailFilterManager.jsx",
            "MailFilterManagerEditor": "MailFilterManagerEditor.jsx",
            "MailForms": "mailForms.jsx",
            "MailMessage": "MailMessage.jsx",
            "MailPanel": "MailPanel.jsx",
            "MailPanelNode": "MailPanelNode.jsx",
            "MailSearch": "MailSearch.jsx",
            "MailSearchList": "MailSearchList.jsx",
            "MailSearchOptions": "MailSearchOptions.jsx",
            "MailSettings": "mailSettings.jsx",
            "MailView": "MailView.jsx",
            "Main": "main.jsx",
            "MainBar": "MainBar.jsx",
            "MainDialog": "mainDialog.jsx",
            "MediaPermissionDialog": "mediaPermissionDialog.jsx",
            "MediaPermissionNotificator": "mediaPermissionNotificator.jsx",
            "Menu": "menu/Menu.jsx",
            "MenuItem": "MenuItem.jsx",
            "MenuType": "menuType.jsx",
            "MessageBody": "MessageBody.jsx",
            "MessageHeader": "MessageHeader.jsx",
            "Modal": "Modal.jsx",
            "MouseGestures": "MouseGestures.jsx",
            "NavigationButton": "NavigationButton.jsx",
            "NetworkSettings": "networkSettings.jsx",
            "NotesEditor": "NotesEditor.jsx",
            "NotesPanel": "notesPanel.jsx",
            "NotesTree": "notesTree.jsx",
            "NotificationPermissionDialog": "notificationPermissionDialog.jsx",
            "NotificationPermissionNotificator": "notificationPermissionNotificator.jsx",
            "OmniDropdown": "omnidropdown.jsx",
            "OpenSessionDialog": "openSessionDialog.jsx",
            "PageActionChooser": "PageActionChooser.jsx",
            "PageloadProgress": "PageloadProgress.jsx",
            "Panel": "components/panels/panel.jsx",
            "PanelSettings": "settings/panel/Panel.jsx",
            "PopupBlockerDialog": "popupblockerDialog.jsx",
            "PopupBlockerNotificator": "popupblockerNotificator.jsx",
            "PopupContents": "PopupContents.jsx",
            "PopupWindow": "popup.jsx",
            "Privacy": "privacy.jsx",
            "QCHistoryItem": "quickCommands/HistoryItem.jsx",
            "QCTitleItem": "quickCommands/TitleItem.jsx",
            "QuickCommandItem": "quickCommands/CommandItem.jsx",
            "QuickCommandList": "QuickCommandList.jsx",
            "QuickCommands": "quickCommands.jsx",
            "QuickCommandSearch": "QuickCommandSearch.jsx",
            "RadioGroup": "RadioGroup.jsx",
            "ReaderModePanel": "ReaderModePanel.jsx",
            "SavedPasswordItem": "savedPasswordItem.jsx",
            "SavedPasswords": "savedPasswords.jsx",
            "SaveSessionDialog": "saveSessionDialog.jsx",
            "SearchEngines": "searchEngines.jsx",
            "SearchField": "searchfield.jsx",
            "SessionTree": "SessionTree.jsx",
            "Settings": "settings/Settings.jsx",
            "SetVivaldiDefaultBrowserDlg": "setVivaldiDefaultBrowserDlg.jsx",
            "SetVivaldiDefaultSettings": "SetVivaldiDefaultSettings.jsx",
            "ShortCutEditSetting": "KeyboardShortcutEditSetting.jsx",
            "ShowKeyboardShortcuts": "showKeyboardShortcuts.jsx",
            "SiteInfoButton": "SiteInfoButton.jsx",
            "SlideBar": "SlideBar.jsx",
            "SmoothScrollingSetting": "smoothscrolling.jsx",
            "SortingSelector": "SortingSelector.jsx",
            "SpecificSession": "specificSession.jsx",
            "SpecificSessionItem": "specificSessionItem.jsx",
            "StartPage": "components/startpage/StartPage.jsx",
            "StartPageSettings": "settings/startpage/StartPage.jsx",
            "StartPageTopMenu": "startpage-topmenu.jsx",
            "StartupSettingsSection": "startupSettingsSection.jsx",
            "StartupSettings": "settings/startup/StartupSetting", //todo: replace with "settings/startup/StartupSettings.jsx"
            "StatusInfo": "StatusInfo.jsx",
            "StatusToolbar": "StatusToolbar.jsx",
            "sync": "sync.jsx",
            "SyncDialog": "SyncDialog.jsx",
            "Tab": "Tab.jsx",
            "TabActivation": "tabActivation.jsx",
            "TabBar": "TabBar.jsx",
            "TabCycling": "tabCycling.jsx",
            "TabMuting": "tabMuting.jsx",
            "TabOpen": "tabOpen.jsx",
            "TabPageSetting": "TabPage.jsx",
            "TabPinning": "tabPinning.jsx",
            "TabPositionPreview": "TabPositionPreview.jsx",
            "TabProgressIndicator": "TabProgressIndicator.jsx",
            "TabSelection": "tabSelection.jsx",
            "TabsSettingSection": "tabsSettingSection.jsx",
            "TabStacking": "tabStacking.jsx",
            "TabStrip": "TabStrip.jsx",
            "TabToLinksSetting": "TabToFocus.jsx",
            "ThemeColors": "ThemeColors.jsx",
            "ThemeEditor": "ThemeEditor.jsx",
            "ThemePreview": "ThemePreview.jsx",
            "Themes": "Themes.jsx",
            "ThemeScheduling": "ThemeScheduling.jsx",
            "Thumbnail": "Thumbnail.jsx",
            "TitleBar": "titlebar.jsx",
            "ToggleImages": "ToggleImages.jsx",
            "ToggleTiling": "ToggleTiling.jsx",
            "Tooltip": "Tooltip.jsx",
            "TopMenu": "TopMenu.jsx",
            "Trash": "Trash.jsx",
            "TreeItem": "TreeItem.jsx",
            "TypedHistory": "typedhistory.jsx",
            "UrlBar": "urlbar.jsx",
            "UrlField": "urlfield.jsx",
            "VisualTabSwitcher": "VisualTabSwitcher.jsx",
            "VivaldiDropdown": "common/Dropdown.jsx",
            "VivaldiSettingsWrapper": "InsertVivaldiSettings.jsx",
            "VivaldiTreeList": "VivaldiTreeList.jsx",
            "WebPageCollection": "WebPageCollection.jsx",
            "WebPageContent": "WebPageContent.jsx",
            "webpagesPlugins": "webpagesPlugins.jsx",
            "WebpagesSettingSection": "webpagesSettingSection.jsx",
            "WebPanel": "webPanel.jsx",
            "WelcomePage": "welcome.jsx",
            "WelcomeStep": "WelcomeStep.jsx",
            "ZoomIndicator": "ZoomIndicator.jsx",
        };

        var moduleSignatures = {
            "AddressBarShortcuts": ['("Open Address in New Tab")'],
            "BookmarksMock": ["otherBookmarksFolder", '"Other Bookmarks"', ".bookmarkItems"],
            "categoryConstantToString": ['"Mail"', '"Page"'],
            "chroma": ['"Logarithmic scales are only possible for values > 0"'],
            "classnames": ["http://jedwatson.github.io/classnames"],
            "css-layout": ["computeLayout:", "fillNodes:"],
            "dexie": ['"Dexie specification of currently installed DB version is missing"'],
            "EditableSpeedDialTitle": ["editable-title-container"],
            "HistoryStoreSubscription": ["_onStoreChange:", "historyFilter:", '"searchResultsReady"'],
            "InputMixin": ["renderOption:", "renderInputField:"],
            "MailSender": ['"Failed to send message"'],
            "Motion": ["startAnimationIfNecessary", "currentVelocity:"],
            "NativeResizeObserver": ["NativeResizeObserver.js"],
            "OkChangeButton": ['("OK")', '("Change")'],
            "path": ["Arguments to path.resolve must be strings"],
            "Portal": ["getOverlayDOMNode(): A component must be mounted to have a DOM node"],
            "process": ["process.binding is not supported"],
            "progress_indicator": ['.createElement("progress"', "bar:", "circular:"],
            "punycode": ['"Overflow: input needs wider integers to process",'],
            "SpeedDial": ["handleRemoveDial"],
            "SpeedDialAddButton": ['"openAddSpeedDial"', '"thumbnail-image"'],
            "SpeedDialAddContent": ["dials dial-suggestions"],
            "SpeedDialDrawer": ["toggleStartpageDrawer", '"add-dial-submit primary"'],
            "SpeedDialView": ["startpage-folder-navigation"],
            "StorageMock": ["StorageMock", "getBytesInUse:"],
            "TabsMock": ["captureVisibleTab"],
            "ThemeScheduleDaemon": ["getTimerByDate:", "this.state.THEMES_SCHEDULE"],
            "url": [".prototype.parseHost"],
            "VelocityComponent": ["_clearVelocityCache"],
            "VelocityTransitionGroupChild": [".CSS.setPropertyValue", "_parseAnimationProp"],
            "WindowsMock": ["getLastFocused", "this.WINDOW_ID_CURRENT"],

            "_ActionList_DataTemplate": ["CHROME_SET_SESSION:", "CHROME_TABS_ACTIVATED:"],
            "_ActionManager": ["runAction:"],
            "_BGTaskActions": ["setBackgroundTasks:"],
            "_BookmarkBarActions": ["setBookmarkBarFolder:"],
            "_Bookmarks": ["getBookmark:"],
            "_BookmarkStore": ['getDefault("BOOKMARKS_BAR_FOLDER_IDS")', "getBookmarksBar"],
            "_BookmarkThumbnailActions": [".BOOKMARK_THUMBNAIL_QUEUE_ADD_ITEM,"],
            "_bytes": ["hexToBytes:", "bytesToHex:"],
            "_Clipboard": ["pasteAsPlainText:"],
            "_clone": ["typeof Symbol.iterator", '"function"', '"symbol"', '"function"', '"object"', ".constructor()", ".hasOwnProperty("],
            "_CommandManager": ["getUserEditableCommands:"],
            "_ContentScriptActions": ["addContentScript:"],
            "_ContentScriptStore": [".CONTENT_SCRIPT_LOAD:", ".CONTENT_SCRIPT_PAGE_REMOVE:"],
            "_decodeDisplayURL": [".removeTrailingSlashWhenNoPath(", ".getDisplayUrl(", "replace(/%20/"],
            "_getLocalizedMessage": [".i18n.getMessage"],
            "_GetPlatform": ['navigator.platform.indexOf("Linux")', '"linux"', 'navigator.platform.indexOf("MacIntel")', '"mac"', '"win"'],
            "_getPrintableKeyName": ['"BrowserForward"', '"PrintScreen"'],
            "_HandleActions": ["handleChromeAction:"],
            "_humanizedate": ['"about a minute ago"', '"in about an hour"'],
            "_KeyboardShortcuts": ["keyComboFromEvent:"],
            "_KeyCodes": ["KEY_CANCEL:"],
            "_KeyNameToChar": [".replace(/capslock/g,"],
            "_languageList": ["ru:", "bg:"],
            "_lodash_js_unk": ['"__lodash_hash_undefined__"', '"__lodash_placeholder__"', "lodash.templateSources"],
            "_MailActions": [".MAIL_ADD_MESSAGES,"],
            "_mime_list": ["application/vnd.intercon.formnet"],
            "_MouseGesturesHandler": ['.get("MOUSE_GESTURES_ENABLED"'],
            "_NavigationActions": ["setNavigationState:", "setProgressState:"],
            "_NavigationButtonActions": ["navigateRewind:"],
            "_NavigationState": ["getNavigationInfo:"],
            "_NotesHandler": [".CHROME_NOTES_CREATED,"],
            "_NoteStore": [".NOTES_LOAD_ALL:", ".NOTES_REMOVE_ITEM:"],
            "_OmniSettings_DataTemplate": ["OMNI_RESULT_COUNT:"],
            "_PageActions": [".CHROME_TABS_CREATED,", ".CHROME_TABS_REMOVED,"],
            "_PageStore": [".PAGE_TOGGLE_PINNED:", ".PAGE_SET_TARGET_URL:"],
            "_PanelActions": ["showNextPanel:"],
            "_PanelContainerActions": ["getFirstAvailablePanel:"],
            "_requestIdleCallback": ["return window.requestIdleCallback"],
            "_SearchFieldActions": [".SEARCH_FIELD_SET_STATE,"],
            "_SearchSuggestActions": ["suggest:", ".SEARCH_SUGGEST_RESULT"],
            "_SessionManager": [".sessions.onChanged.addListener"],
            "_SettingsAppearance": ['"Use Native Window"'],
            "_SettingsData_Common": ['["ctrl+shift+v"]', "COMMAND_CLIPBOARD_PASTE_AS_PLAIN_TEXT_OR_PASTE_AND_GO"],
            "_SettingsData_MAC": ['["shift+meta+v"]', "COMMAND_CLIPBOARD_PASTE_AS_PLAIN_TEXT_OR_PASTE_AND_GO"],
            "_SettingsData_Other": ['["ctrl+shift+w"]'],
            "_SettingsMigration": ['"SETTINGS_MIGRATION_VERSION"', "configurable:"],
            "_SettingsMigration_1": ["preferenceKey:", '"vivaldi.home_page"'],
            "_SettingsMigration_2": ["keep_relations", ".TAB_CLOSE_ACTIVATION"],
            "_SettingsMigration_3": ['"Migrating Search Engines from"', ".SEARCH_ENGINES", '"to"'],
            "_SettingsMigration_4": ["6607C819-705B-493E-B85F-75D5FF8ECA5D"],
            "_SettingsMigration_5": ["A9AF7AAEA7E", "AD6C08C471A"],
            "_SettingsMigration_6": [".TABCOLOR_BEHIND_TABS", "TABCOLOR_BEHIND_TABS:", "on", "Promise"],
            "_SettingsMigration_7": ['.getSync("THEMES_SYSTEM")', ".THEMES_USER", "THEMES_USER:", ".cloneDeep"],
            "_SettingsTabOptions": ['"Use Unread Indicators"'],
            "_SettingsTabPosition": ['"Show Tab Bar"', '"Tab Bar Position"'],
            "_ShowMenu": [".showMenu.onUrlHighlighted.addListener("],
            "_ShowUI": ['document.getElementById("app")', "show hidden application window because of missing current window"],
            "_SpatNavHandler": [".SPATNAV_NAVIGATE,"],
            "_SpeedDialChangeListener": ["bookmarksPrivate.updateSpeedDialsForWindowsJumplist"],
            "_StatusActions": ["setStatus:"],
            "_TabActions": ["switchTabBackBySetting:"],
            "_Thumbnails": ["getPageThumbnail:"],
            "_TooltipActions": ["clearTooltip:", "showTooltip:"],
            "_TooltipStore": [".TOOLTIP_CLEAR:", ".TOOLTIP_SHOW:"],
            "_treeSort": ["treeSort:", "getDefaultComparator:"],
            "_trydecodeURI": ["return decodeURI("],
            "_trydecodeURIComponent": ["return decodeURIComponent(", "catch"],
            "_TypedHistory": [".NAVIGATION_ADD_TYPED_HISTORY:"],
            "_TypedSearchHistory": ["getSearchText:", "getTypedSearchHistory:"],
            "_UIActions": ["showConfirmOpenBookmarkDialog:"],
            "_updatePage": ["tabToPage", "updatePage", '"favIconUrl"'],
            "_urlDecode": ['"%20"', '/\\+/g', "decodeURIComponent"],
            "_urlEncode": ["encodeURIComponent(", '"number"'],
            "_UrlFieldActions": ["setUrlfieldState:"],
            "_UrlUtility": [".getDisplayTitle", "this._defaultMapDisplayUrlToUrl"],
            "_UserAgentSpoofRules": ["navigator.userAgent.replace(/Vivaldi/,"],
            "_ViewActionHandler": [".TAB_NEW_TAB:"],
            "_VivaldiSettings": ["getKeysSync:", "getAllPrefs:"],
            "_WebPageViewActions": ["showFindInPageToolbar:"],
            "_WebPanelActions": ["copyWebPanelAdress:"],
            "_WebViewActions": ["setActiveWebView:"],
            "_zlibstream": ["Problem initializing deflate stream: ", "Problem initializing inflate stream: "],
            "chrome": ["savedpasswords:", "topSites:"],
            "chromeWrapper": ["window.chrome.tabs"],
            "events": [".EventEmitter", ".listenerCount"],
            "isEventSupported": ["Checks if an event is supported in the current execution environment."],
            "keyMirror": ["keyMirror(...): Argument must be an object."],
            "nm_buffer": ["The buffer module from node.js"],
            "nm_immutable": ["Expected Array or iterable object of [k, v] entries"], //node_modules\immutable\dist\immutable.js
            "vivaldi": ["bookmarksPrivate:"],

            "_svg_addressbar_btn_backward": ["M17.6 20.4l-1.6 1.6-9-9 9-9 1.6 1.6-7.2 7.4 7.2 7.4z"],
            "_svg_addressbar_btn_fastbackward": ["M19 6l-7 5.6v-5.6h-2v12h2v-5.6l7 5.6z"],
            "_svg_addressbar_btn_fastforward": ["M10 6l7 5.6v-5.6h2v12h-2v-5.6l-7 5.6z"],
            "_svg_addressbar_btn_forward": ["M15.2 13l-7.2 7.4 1.6 1.6 9-9-9-9-1.6 1.6 7.2 7.4z"],
            "_svg_addressbar_btn_home": ["10h3.5v8h14v-8h3.5l-10.5-10zm5 16h-3v-5h-4v5h-3v"],
            "_svg_addressbar_btn_reload": ["M4 13c0 4.95 4.05 9 9 9 4.162 0 7.65-2.924 8.662-6.75h-2.362c-.9 2"],
            "_svg_addressbar_btn_reload_stop": ["M9.4 18l-1.4-1.4 4.6-4.6-4.6-4.6 1.4-1.4 4.6 4.6 4.6-4.6 1.4 1.4-4.6 4.6 "],
            "_svg_bookmarked": ["M4,1 L4,14 L8,12 L12,14 L12,1 L4,1 Z M6,3 L10,3 L10,10.763"],
            "_svg_bookmarks_toolbar_import": ["M13 18l4-4H9l4 4zM12 8v6h2V8h-2z"],
            "_svg_bookmarks_update_thumbnail": ["M12.6 7C9.507 7 7 9.506 7"],
            "_svg_btn_delete": ["M13.5 6l-1.4-1.4-3.1 3-3.1-3L4.5"],
            "_svg_btn_dropdown": ["M8 11l4-6H4l4 6z"],
            "_svg_btn_minus": ["M9 14h8v-2H9v2z"],
            "_svg_btn_paneltoggle": ["195v12h-16v-12h16zm-10"],
            "_svg_btn_plus": ["M11.975 14.04H9.02v-2.036h2.955V9h2.037v3.004h2.982v2.037h-2.982v2.934h-2.037V14.04z"],
            "_svg_button_restart": ["M13 13H6V6l7 7z"],
            "_svg_menu_bookmarks": ["M3 2v12l5-2 5 2V2H3zm8 9L8 9.646 5 11V4h6v8-1z"],
            "_svg_menu_contacts": ["M10.4 7.43c1.02 0 1.8-.744 1.8-1.716"],
            "_svg_menu_downloads": ["M8.914 6.995V3H6.057v3.995c0"],
            "_svg_menu_mail": ["3v10h14V3H1zm7"],
            "_svg_menu_notes": ["2v12h10V2H3zm9 11H4V4h8v9z"],
            "_svg_menu_settings": ["M12.55 8v.592l1.325 1.014c.088.084.177.253.088.338l-1.236"],
            "_svg_menu_vivaldi": ["M10.428 5.038c-.42-.85.027-1.804.943-2.008.747-.167 1.518.386 1.617"],
            "_svg_notes_add_attachment": [".436.28.97.7.97h5.95c.98 0 1.75-1.043 1.75-2.06 0-1.02-.77-1.82-1.75"],
            "_svg_notes_happynote": ['id="eye"'],
            "_svg_pageactionchooser": ["M5.3 9.8L.8 6.5l4.6-3.3L6.6 5 4.2 6.4l2.3 1.7-1.2 1.6M10.7"],
            "_svg_panel_bookmarks": ["v-11h8v11l-4"],
            "_svg_panel_contacts": ["M15.6 19h5.4v-2.2c0-1.5-3-2.8-4.7-2.8-.7"],
            "_svg_panel_downloads": ["M15 6h-4v5h-4l6 6 6-6h-4v-5zm-9"],
            "_svg_panel_downloads_btn_resume": ["M16 13l-6 5V8l6 5z"],
            "_svg_panel_downloads_btn_stop": ["M9 9h8v8H9z"],
            "_svg_panel_history": ["M13.5 21a7.5 7.5 0 1 0 0-15 7.5 7.5"],
            "_svg_panel_mail": ["8v11h16V8H5zm8"],
            "_svg_panel_notes": ["20h12v-14h-12v14zm2-11h8v9h"],
            "_svg_panel_settings": ["M10.982 17.576v.424l.404 1.704c0 .197.101.296.303.296h2.725c.101"],
            "_svg_search_change_engine": ["M-182.6 201.9c.4-.7.7-1.5.7-2.3"],
            "_svg_settings_category_addressbar": ["M0 0v10h16v-10h-16zm2"],
            "_svg_settings_category_all": ["M16 9.077v-2.155l-1.913-.68c"],
            "_svg_settings_category_appearance": ["4h16v10H0V4zm2"],
            "_svg_settings_category_bookmarks": ["M3 2v13.333l5-1.666"],
            "_svg_settings_category_downloads": ["M2 14h12v2h-12v-2zm12-4h2v6h-2v-6zm-14"],
            "_svg_settings_category_keyboard": ["M0 4v9h16v-9h-16zm7"],
            "_svg_settings_category_mail": ["M0 0v12h16v-12h-16zm8"],
            "_svg_settings_category_mouse": ["M7.5 0c-3.025 0-5.5 2.314-5.5"],
            "_svg_settings_category_network": ["M9 8v2h-2v-2h-4v2h-2v-4h6v-2h-2v-4h6v4h"],
            "_svg_settings_category_panel": ["M16 0v12h-16v-12h16zm-10"],
            "_svg_settings_category_privacy": ["M8 13c3.636 0 6.764-2.067"],
            "_svg_settings_category_qc": ["M8 7.042l-4-4.042h3l4"],
            "_svg_settings_category_search": ["M11.172 9.757l4.192 4.192-1.414"],
            "_svg_settings_category_start_page": ["2h7v6h-7zm8 0h7v6h-7zm-8"],
            "_svg_settings_category_startup": ["M9.96 2.446c-.498-1.02.032-2.164"],
            "_svg_settings_category_tabs": ["M0 9h16v2h-16v-2zm0"],
            "_svg_settings_category_themes": ["M5.976 11c-1.92.537-1.91"],
            "_svg_settings_category_webpages": ["M8 1c-3.9 0-7 3.1-7 7s3.1"],
            "_svg_sorting_selector_descending": ["M5.5.133l.11-.11 4.456"],
            "_svg_speeddial_update_thumbnail": ["M13 4c-4.95 0-9 4.05-9 9s4.05 9 9 9c4.163"],
            "_svg_startpage_newfolder": ['id="smallplus"'],
            "_svg_tabstrip_btn_newtab": ["M7 9h-4v-2h4v-4h2v4h4v2h-4v4h-2v-4zm-7-9v16h16v-16h-16z"],
            "_svg_tabstrip_btn_trashcan": ['"trashicon-content"'],
            "_svg_toggleimages_noimages": ["M16 2H0v12h16V2zM4.89"],
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
            "_svg_notes_tree_note": ["2h10v12h-10v-12zm1 2h8v9h-8v-9zm1"],
            "_svg_notes_tree_note_has_url": ["M13 8v-6h-10v12h7v2l2.5-2"],
            "_svg_vivaldi_horizontal_menu": ['id="horizontal-menu-button'],
            "_svg_vivaldi_title": ['id="vivrect1"'],
            "_svg_vivaldi_v": ["M14.726 7.446c-.537-1.023.035-2.164 1.2-2.41.948-.2"],

            "react__invariant": ["Minified exception occurred; use the non-minified dev environment"],
            "react_AutoFocusUtils": ["focusDOMComponent:"],
            "react_BeforeInputEventPlugin": ["compositionUpdate:"],
            "react_createMicrosoftUnsafeLocalFunction": ["MSApp.execUnsafeLocalFunction"],
            "react_CSSProperty": ["borderTopWidth:"],
            "react_CSSPropertyOperations": ["createMarkupForStyles:"],
            "react_DOMChildrenOperations": ["dangerouslyReplaceNodeWithMarkup:", "replaceDelimitedText:"],
            "react_DOMLazyTree": [".insertTreeBefore", ".replaceChildWithTree", ".queueHTML"],
            "react_DOMNamespaces": ["mathml:", "http://www.w3.org/1998/Math/MathML"],
            "react_DOMProperty": ["ROOT_ATTRIBUTE_NAME:"],
            "react_DOMPropertyOperations": ["createMarkupForCustomAttribute:"],
            "react_emptyFunction": [".thatReturnsThis", ".thatReturnsArgument"],
            "react_EnterLeaveEventPlugin": ["mouseEnter:"],
            "react_EventPluginHub": ["enqueueEvents:"],
            "react_EventPluginRegistry": ["getPluginModuleForEvent:"],
            "react_EventPluginUtils": ["executeDirectDispatch:"],
            "react_EventPropagators": ["accumulateDirectDispatches:"],
            "react_ExecutionEnvironment": ["canUseDOM:", "canUseEventListeners:"],
            "react_FallbackCompositionState": ["getData:", "return this._fallbackText"],
            "react_findDOMNode": [".nodeType", ".render", ".getNodeFromInstance(", "Object.keys("],
            "react_getEventKey": ["19:", "MozPrintableKey:"],
            "react_getVendorPrefixedEventName": ["animationend:"],
            "react_HTMLDOMPropertyConfig": ["required:"],
            "react_instantiateReactComponent": ["_instantiateReactComponent:", ".createInstanceForText("],
            "react_LinkedValueUtils": ["You provided a `checked` prop to a form field without an `onChange` handler"],
            "react_onClickOutside": ["Component lacks a handleClickOutside(event) function for processing outside click events."],
            "react_PooledClass": ["twoArgumentPooler:"],
            "react_React": ["only:", "toArray:"],
            "react_ReactBrowserEventEmitter": ["listenTo:"],
            "react_ReactChildReconciler": ["instantiateChildren:"],
            "react_ReactChildren": ["mapIntoWithKeyPrefixInternal:"],
            "react_ReactClass": ["getChildContext:"],
            "react_ReactComponent": [".isReactComponent", ".enqueueForceUpdate("],
            "react_ReactComponentEnvironment": [".processChildrenUpdates", "replaceNodeWithMarkup:"],
            "react_ReactCompositeComponent": ["performInitialMountWithErrorHandling:"],
            "react_ReactDefaultBatchingStrategy": ["this.reinitializeTransaction()", "isBatchingUpdates:", "batchedUpdates:"],
            "react_ReactDOM": ["findDOMNode:"],
            "react_ReactDOMComponentFlags": ["hasCachedChildNodes:"],
            "react_ReactDOMComponentTree": ["getClosestInstanceFromNode:", '" react-text: "'],
            "react_ReactDOMFactories": ["samp:"],
            "react_ReactDOMFeatureFlags": ["useCreateElement:"],
            "react_ReactDOMInput": ["initialChecked:"],
            "react_ReactDOMOption": ["postMountWrapper:", "selected:", ".getSelectValueContext"],
            "react_ReactDOMSelect": ["getSelectValueContext:", "initialValue:", "wasMultiple:"],
            "react_ReactDOMSelection": ["getOffsets:"],
            "react_ReactDOMTextComponent": [".getNodeFromInstance(", ".createDocumentFragment("],
            "react_ReactEmptyComponent": ["injectEmptyComponentFactory:"],
            "react_ReactErrorUtils": ["rethrowCaughtError:"],
            "react_ReactEventEmitterMixin": ["handleTopLevel:", ".extractEvents("],
            "react_ReactEventListener": ["_handleTopLevel:", "WINDOW_HANDLE:"],
            "react_ReactFeatureFlags": ["logTopLevelRenders:"],
            "react_ReactHostComponent": ["createInstanceForText:"],
            "react_ReactInjection": ["EventEmitter:"],
            "react_ReactInputSelection": ["hasSelectionCapabilities:"],
            "react_ReactInstanceMap": ["._reactInternalInstance"],
            "react_ReactMarkupChecksum": ["canReuseMarkup:"],
            "react_ReactMount": ["_mountImageIntoNode:"],
            "react_ReactMultiChild": ["createChild:"],
            "react_ReactNodeTypes": ["EMPTY:", "COMPOSITE:"],
            "react_ReactOwner": ["removeComponentAsRefFrom:"],
            "react_ReactPropTypes": ["objectOf:"],
            "react_ReactRef": [".detachRefs", ".removeComponentAsRefFrom"],
            "react_ReactUpdateQueue": ["enqueueElementInternal:"],
            "react_ReactUpdates": ["injectBatchingStrategy:"],
            "react_renderSubtreeIntoContainer": [".renderSubtreeIntoContainer"],
            "react_SelectEventPlugin": ["focusOffset:"],
            "react_setInnerHTML": ["/<(!--|link|noscript|meta|script|style"],
            "react_SVGDOMPropertyConfig": ["requiredExtensions:"],
            "react_SyntheticAnimationEvent": ["animationName:"],
            "react_SyntheticClipboardEvent": ["clipboardData:"],
            "react_SyntheticDragEvent": ["dataTransfer:"],
            "react_SyntheticEvent": ["eventPhase:"],
            "react_SyntheticKeyboardEvent": ["charCode:"],
            "react_SyntheticWheelEvent": ["deltaZ:"],
            "react_Transaction": ["reinitializeTransaction:"],
            "react_ViewportMetrics": ["currentScrollLeft:"],
        };

        vivaldi.jdhooks._moduleMap = {};
        var slashre = new RegExp("\\\\\\\\", 'g');

        for (var modIndex in vivaldi.jdhooks._modules) {
            var found = false;

            function AddAndCheck(modIndex, moduleName) {
                if (("undefined" !== typeof vivaldi.jdhooks._moduleMap[moduleName]) && (vivaldi.jdhooks._moduleMap[moduleName] != modIndex))
                    console.log('jdhooks: repeated module name "' + moduleName + '"');

                vivaldi.jdhooks._moduleMap[moduleName] = modIndex;
                //vivaldi.jdhooks._moduleNames[modIndex] = moduleName;
                return true;
            }

            var fntxt = vivaldi.jdhooks._modules[modIndex].toString();
            var fntxtPrepared = fntxt.replace(slashre, "/").toLowerCase();


            for (var jsxModuleName in jsxNames) {
                if (-1 !== fntxtPrepared.indexOf(jsxNames[jsxModuleName].toLowerCase())) {
                    found = AddAndCheck(modIndex, jsxModuleName);
                    if (fastProcessModules) delete jsxNames[jsxModuleName];
                    break;
                }
            }

            if (fastProcessModules && found) continue;

            //signatures
            for (var moduleName in moduleSignatures) {
                if (moduleSignatures[moduleName].every(function(i) {
                        return -1 < fntxt.indexOf(i)
                    })) {
                    found = AddAndCheck(modIndex, moduleName);
                    if (fastProcessModules) delete moduleSignatures[moduleName];
                    break;
                }
            }
        }


        function checkUnknown(obj) {
            for (var moduleName in obj)
                if (!vivaldi.jdhooks._moduleMap[moduleName]) {
                    console.log("jdhooks: unknown module", moduleName);
                }
        }

        checkUnknown(jsxNames);
        checkUnknown(moduleSignatures);
    }

    //---------------------------------------------------------------------

    var oldWebpackJsonp = window.webpackJsonp;
    window.webpackJsonp = function(chunkIds, modules, startupModules) {
        //hook startup module
        var startmodule = startupModules ? startupModules[0] : 0;
        var oldm0 = modules[startmodule];
        modules[startmodule] = function(moduleInfo, exports, nrequire) {
            vivaldi.jdhooks.require = function(module) {
                var retValue = null;

                if ("number" === typeof module) retValue = nrequire(module);
                else {

                    if ("undefined" === typeof vivaldi.jdhooks._moduleMap[module])
                        throw "jdhooks.require: unknown module " + module;

                    retValue = nrequire(vivaldi.jdhooks._moduleMap[module]);
                }
                if (retValue.hasOwnProperty("a")) retValue = retValue.a;
                else
                if (retValue.hasOwnProperty("default")) retValue = retValue.default; //todo: whitelist?

                return retValue;
            };
            for (var i in nrequire) {
                if (typeof nrequire[i] === "object" && typeof nrequire[i][startmodule] === "function") {
                    vivaldi.jdhooks._modules = nrequire[i];
                }
            }

            if (!vivaldi.jdhooks._modules) {
                console.log("jdhooks: cannot find modules table");
                return oldm0(moduleInfo, exports, nrequire);
            } else {

                //all ok

                makeSignatures();

                var callStack = [];
                for (var moduleIndex in vivaldi.jdhooks._modules) {
                    (function(moduleIndex, oldfn) {
                        vivaldi.jdhooks._modules[moduleIndex] = function(moduleInfo, exports, require) {
                            callStack.push(moduleInfo.i);
                            oldfn(moduleInfo, exports, require);
                            callStack.pop();
                        }
                    })(moduleIndex, vivaldi.jdhooks._modules[moduleIndex]);
                }

                vivaldi.jdhooks.hookModule("VivaldiSettingsWrapper", function(moduleInfo, exportsInfo) {
                    vivaldi.jdhooks.hookMember(exportsInfo.parent, exportsInfo.name, function(hookData, fn, settingsKeys) {
                        var hookCallbacks = hookSettingsWrapperList[callStack[callStack.length - 1]];

                        for (var i in hookCallbacks) {
                            hookCallbacks[i](fn, settingsKeys);
                        }

                    });
                });


                //hookModule("_ShowUI", function(moduleInfo) {
                //    //all classes created
                //});

                //hook classes
                vivaldi.jdhooks._classes = {};
                hookModule("react_React", function(moduleInfo, exportsInfo) {
                    hookMember(exportsInfo.exports, "createClass", function(hookData, reactClass) {
                        if ("undefined" !== typeof hookClassList[reactClass.displayName]) {

                            if (vivaldi.jdhooks._unusedClassHooks[reactClass.displayName]) delete vivaldi.jdhooks._unusedClassHooks[reactClass.displayName];

                            for (var i in hookClassList[reactClass.displayName]) {
                                hookClassList[reactClass.displayName][i](reactClass);
                            }
                        }

                        vivaldi.jdhooks._classes[reactClass.displayName] = reactClass;
                    });
                });

                //wait for UI
                hookModule("_requestIdleCallback", function(moduleInfo, exportsInfo) {
                    vivaldi.jdhooks.hookMember(exportsInfo.parent, exportsInfo.name, function(hookData, cat) {
                        document.dispatchEvent(new Event("jdhooks.uiready"))
                    });
                });

                loadHooks(function() {
                    return oldm0(moduleInfo, exports, nrequire)
                });
            }

        }

        return oldWebpackJsonp && oldWebpackJsonp(chunkIds, modules, startupModules);
    }

})();