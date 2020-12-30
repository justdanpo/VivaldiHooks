//Keyboard shortcuts for SpeedDial
//Горячие клавиши для элементов экспресс-панели


//TODO: cannot display category name :(

vivaldi.jdhooks.hookModuleExport("vivaldiSettings", "default", exports => {
    let oldGetDefault = exports.getDefault
    exports.getDefault = name => {
        if (typeof name == "string" && name.substr(0, 23) == "COMMAND_OPEN_SPEEDDIAL_") return { showInQC: true }
        return oldGetDefault(name)
    }
    return exports
})

vivaldi.jdhooks.hookModuleExport('_CommandManager', "default", exports => {

    function openSpeedDialItem(i) {
        const UrlFieldActions = vivaldi.jdhooks.require("_UrlFieldActions")
        const PrefKeys = vivaldi.jdhooks.require("_PrefKeys")
        const PrefCache = vivaldi.jdhooks.require('PrefsCache')

        const sdi = vivaldi.jdhooks.require('_BookmarkStore').getSpeeddialFolders()

        if (sdi && sdi[0] && sdi[0].children[i - 1]) {
            UrlFieldActions.go([sdi[0].children[i - 1].url], {
                inCurrent: !PrefCache.get(PrefKeys.kQuickCommandsOpenUrlInNewTab),
                addTypedHistory: false,
                addTypedSearchHistory: false,
                enableSearch: true
            })
        }
    }

    let cmds = exports.getCommands()

    for (let i = 1; i < 10; i++) {
        (function (x) {
            cmds.push({
                name: "COMMAND_OPEN_SPEEDDIAL_" + x,
                action: () => openSpeedDialItem(x),
                label: "Open SpeedDial item " + x,
                labelEnglish: "Open SpeedDial item " + x,
                category: 'CATEGORY_COMMAND_HOOK',
                showInQC: true
            })
        }
        )(i)
    }

    return exports
})
