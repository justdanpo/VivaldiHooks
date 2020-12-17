//International Domain Names decoder

vivaldi.jdhooks.hookModule("_decodeDisplayURL", function (moduleInfo, exports) {
    const url = vivaldi.jdhooks.require("url")
    const punycode = vivaldi.jdhooks.require("punycode")

    //temporarily disabled
    return exports

    return inputUrl => {
        let pass1 = exports(inputUrl)
        if (!pass1) return pass1

        let parsed = url.parse(pass1)
        if (!parsed.host) return pass1

        parsed.host = punycode.toUnicode(parsed.host)
        return url.format(parsed)
    }
})