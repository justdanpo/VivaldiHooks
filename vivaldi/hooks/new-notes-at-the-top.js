//New notes at the top
//Новые заметки в начале

vivaldi.jdhooks.hookMember(window.vivaldi.notes, 'create', function(hookData, note, callback) {

    var notesObject = this;

    function moveToTop(item) {
        notesObject.move(item.id, {
            index: 0
        });
    }

    switch (hookData.arguments.length) {
        case 0:
            //we can't do anything
            break;
        case 1:
            hookData.arguments[1] = moveToTop;
            hookData.arguments.length = 2;
            break;
        case 2:
            vivaldi.jdhooks.hookMember(hookData.arguments, '1', function(hoodata, item) {
                moveToTop(item);
            });
            break;
    }
});