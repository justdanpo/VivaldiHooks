//International Domain Names decoder

vivaldi.jdhooks.hookModuleExport("_decodeDisplayURL", "formatUrl", oldFn => {
    const url = vivaldi.jdhooks.require("url")
    const punycode = vivaldi.jdhooks.require("punycode")

    return arg => {
        const newUrl = oldFn(arg)
        let parsed = url.parse(newUrl)
        if (parsed.host) {
            parsed.host = punycode.toUnicode(parsed.host)
            return url.format(parsed)
        }
        return newUrl
    }
})

vivaldi.jdhooks.hookClass("urlfield_UrlBar", oldClass => {
    const punycode = vivaldi.jdhooks.require("punycode")
    return class extends oldClass {

        //TODO: remove after 3.7 released
        static getDerivedStateFromProps(props) {

            if (props.urlFragments) {
                if (props.urlFragments.tld && props.urlFragments.tld.indexOf("xn--") === 0) {

                    if (props.urlFragments.host) props.urlFragments.host = punycode.toUnicode(props.urlFragments.host)
                    props.urlFragments.tld = punycode.toUnicode(props.urlFragments.tld)
                }
            }

            const ret = oldClass.getDerivedStateFromProps(props)
            return ret
        }

        constructor(...e) {
            super(...e)

            const oldSetState = this.setState.bind(this)
            this.setState = (function (state) {
                if (state.urlFragments && state.urlFragments.tld && state.urlFragments.tld.indexOf("xn--") === 0) {

                    if (state.urlFragments.host) state.urlFragments.host = punycode.toUnicode(state.urlFragments.host)
                    state.urlFragments.tld = punycode.toUnicode(state.urlFragments.tld)
                }
                return oldSetState(state)
            })
        }
    }
})
