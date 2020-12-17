//Zoom with a mouse wheel over a zoom control in a status bar

//цифровой индикатор - скролл не работает
//оба - среднеклик для сброса

vivaldi.jdhooks.hookClass("zoom_ZoomIndicator", oldClass => {
    const uaActions = vivaldi.jdhooks.require("_PageZoom")
    const ReactDom = vivaldi.jdhooks.require("ReactDOM")

    return class extends oldClass {
        constructor(...e) {
            super(...e)

            this.zoomControlWheelJs = {
                onWheel: (event => {
                    if (!this.props.disabled) {
                        if (event.deltaY > 0) uaActions.pageZoomOut()
                        if (event.deltaY < 0) uaActions.pageZoomIn()
                    }
                }).bind(this),

                onPointerDown: (event => {
                    if (!this.props.disabled && event.button === 1) {
                        event.preventDefault()
                        event.stopPropagation()
                    }
                }).bind(this),

                onPointerUp: (event => {
                    if (!this.props.disabled && event.button === 1) {
                        uaActions.pageZoomReset()

                        event.stopPropagation()
                        event.preventDefault()
                    }
                }).bind(this)
            }
        }

        componentDidMount() {
            if (super.componentDidMount) super.componentDidMount()

            const control = ReactDom.findDOMNode(this)
            if (control) {
                control.addEventListener("mousewheel", this.zoomControlWheelJs.onWheel, true)
                control.addEventListener("pointerup", this.zoomControlWheelJs.onPointerUp, true)
                control.addEventListener("pointerdown", this.zoomControlWheelJs.onPointerDown, true)
            }
        }

        componentWillUnmount() {
            const control = ReactDom.findDOMNode(this)
            if (control) {
                control.removeEventListener("mousewheel", this.zoomControlWheelJs.onWheel, true)
                control.removeEventListener("pointerup", this.zoomControlWheelJs.onPointerUp, true)
                control.removeEventListener("pointerdown", this.zoomControlWheelJs.onPointerDown, true)
            }

            if (super.componentWillUnmount) super.componentWillUnmount()
        }

    }
})
