//New notes at the top
//Новые заметки в начале

vivaldi.jdhooks.hookMember(window.vivaldi.notes, 'create', function(hookData, note, callback) {

    var notesObject = this;

    vivaldi.jdhooks.hookMember(hookData.arguments, '1', function(hoodata, item) {

        notesObject.move(item.id, {
            index: 0
        });

    });

});