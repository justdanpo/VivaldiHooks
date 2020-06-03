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
                // Expand tree to active tab
                this.refs.treeList.expandToId(e.id)
                // Change selection to active tab
                // this.refs.treeList.selectById(e.id)
            }
        }
    }
    return newCls
})
