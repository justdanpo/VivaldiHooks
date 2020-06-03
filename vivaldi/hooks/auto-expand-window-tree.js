// Auto-expand window panel tree on tab switch

vivaldi.jdhooks.hookClass('tabs_WindowTree', cls => {
    const PageStore = vivaldi.jdhooks.require('_PageStore')
    class newCls extends cls {
        constructor(...e) {
            super(...e)

            let old_onPageStoreChanged = this._onPageStoreChanged
            this._onPageStoreChanged = () => {
                old_onPageStoreChanged()
                const e = PageStore.a.getActivePage()
                this.refs.treeList.expandToId(e.id)
            }
        }
    }
    return newCls
})
