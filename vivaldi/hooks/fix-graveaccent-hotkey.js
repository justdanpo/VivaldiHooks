//Hotkeys: "`/~" button works again. May work incorrectly with some keyboards.
//Горячие клавиши: кнопка "`/~" снова работает. Может работать неправильно с некоторыми клавиатурами.

vivaldi.jdhooks.hookModule("_getPrintableKeyName", function(moduleInfo, exportsInfo) {

    exportsInfo.exports[192] = '`';

});