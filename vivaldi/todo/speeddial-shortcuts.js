//Keyboard shortcuts for SpeedDial
//Горячие клавиши для элементов экспресс-панели

(function() {

    //category name
    vivaldi.jdhooks.hookModule('categoryConstantToString', function(moduleInfo, exportsInfo) {

        var actionList = vivaldi.jdhooks.require('_ActionList_DataTemplate');

        if ('undefined' === typeof actionList.CATEGORY_COMMAND_HOOK) {
            actionList.CATEGORY_COMMAND_HOOK = 'CATEGORY_COMMAND_HOOK';

            vivaldi.jdhooks.hookMember(exportsInfo.parent, exportsInfo.name, function(hookData, cat) {
                if (cat === actionList.CATEGORY_COMMAND_HOOK) {
                    hookData.abort();
                    return "Hooks";
                }
            }, null);
        }
    });

    //default settings
    vivaldi.jdhooks.hookModule('_SettingsData_Common', function(moduleInfo, exportsInfo) {
        for (var i = 1; i < 10; i++) {
            exportsInfo.exports['COMMAND_OPEN_SPEEDDIAL_' + i] = {
                shortcut: [],
                showInQC: true
            };
        }
    });

    var openSpeedDialItem = function(i) {
        var sdi = vivaldi.jdhooks.require('_BookmarkStore').getSpeeddialNodes();

        if (sdi && sdi[0] && sdi[0].children[i - 1]) {
            var innew = vivaldi.jdhooks.require('_VivaldiSettings').getSync("QUICK_COMMAND_OPEN_URL_IN_NEW_TAB");
            vivaldi.jdhooks.require('_PageActions').openURL(sdi[0].children[i - 1].url, {
                inCurrent: !innew,
                inBackground: !innew
            });
        }
    };

    vivaldi.jdhooks.hookModule('_CommandManager', function(moduleInfo, exportsInfo) {
        var commands = exportsInfo.exports.getCommands();

        for (var i = 1; i < 10; i++) {
            (function(x) {
                commands.push({
                    name: "COMMAND_OPEN_SPEEDDIAL_" + i,
                    action: function() {
                        openSpeedDialItem(x)
                    },
                    label: "Open SpeedDial item " + i,
                    category: 'CATEGORY_COMMAND_HOOK'
                });
            })(i);
        }
    });

})();