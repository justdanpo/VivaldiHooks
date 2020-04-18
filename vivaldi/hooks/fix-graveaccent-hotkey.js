//Hotkeys: "`/~" button works again. May work incorrectly with some keyboards.
//Горячие клавиши: кнопка "`/~" снова работает. Может работать неправильно с некоторыми клавиатурами.

vivaldi.jdhooks.hookModule("_getPrintableKeyName", (moduleInfo, exports) => { return { ...exports, ...{ 192: '`' } } })
