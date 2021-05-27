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
