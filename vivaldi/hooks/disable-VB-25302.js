//Disable "VB-25302 Populate Find in Page dialog with page text selection"

vivaldi.jdhooks.hookClass("find-in-page_FindInPage", cls => {
	class newFindInPage extends cls {
		constructor(...e) {
			super(...e)

			this.populateWithPageSelection = () => { this.focusFindInPageInput() }
		}
	}
	return newFindInPage
})
