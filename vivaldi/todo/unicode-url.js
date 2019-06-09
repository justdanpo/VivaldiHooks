//Unicode domains decoder

vivaldi.jdhooks.hookModule("_decodeDisplayURL", function(moduleInfo, exportsInfo) {
    var url = vivaldi.jdhooks.require("url");
    var punycode = vivaldi.jdhooks.require("punycode");

    vivaldi.jdhooks.hookMember(exportsInfo.parent, exportsInfo.name, null, function(hookData, inputUrl) {
        var hostName = url.parse(hookData.retValue).hostname + "";
        var decodedHostName = punycode.toUnicode(hostName);
        return hookData.retValue.replace(hostName, decodedHostName).replace(/ /g, "%20");
    });

});