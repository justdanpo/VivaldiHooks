//New notes at the top
//Новые заметки в начале

vivaldi.jdhooks.hookMember(window.vivaldi.notes, 'create', function(hookData, note, callback) {

    if (undefined === note.index)
        note.index = 0;

});