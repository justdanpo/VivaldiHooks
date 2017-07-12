//Speed Dial item context menu: change image
//Контекстное меню элемента экспресс-панели: изменить изображение

vivaldi.jdhooks.hookModule('SpeedDial', function(moduleInfo) {
    vivaldi.jdhooks.hookMember(moduleInfo.exports.prototype, 'getContextMenuItems', null, function(hookData) {

        var bookmarkId = this.props.node.id;

        function onSelectImage() {
            chrome.fileSystem.chooseEntry({
                type: 'openFile',
                accepts: [{
                    extensions: ['jpg', 'gif', 'png', 'svg']
                }]
            }, function(readOnlyEntry) {

                if (chrome.runtime.lastError) return;

                readOnlyEntry.file(function(file) {
                    var reader = new FileReader();

                    reader.onloadend = function(loadEvent) {
                        chrome.bookmarks.update(bookmarkId, {
                            thumbnail: loadEvent.target.result
                        });

                    };
                    reader.readAsDataURL(file);
                })
            })
        };

        hookData.retValue.push({
            name: vivaldi.jdhooks.require('_getLocalizedMessage')('Change...'),
            handler: onSelectImage,
            visible: this.isBookmark()
        });

        return hookData.retValue;
    });
});