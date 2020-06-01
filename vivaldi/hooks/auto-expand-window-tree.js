// Auto-expand window panel tree on tab switch

vivaldi.jdhooks.hookClass('tabs_WindowTree', cls => {
    const PageStore = vivaldi.jdhooks.require('_PageStore')
    class newCls extends cls {
        constructor(...e) {
            super(...e)

            this._onPageStoreChanged = () => {
                !1 === this.blockPageStoreChange && this._onFilterChange(this.props.filter, () => {})
                const e = PageStore.a.getActivePage()
                e.pinned && (this.lastActivePinnedId = e.id)
                this.refs.treeList.expandToId(e.id)
            }
        }
    }
    return newCls
})
