//dev

vivaldi.jdhooks.dumpVivaldi = () => {

    function xtoa(exports) {
        if (exports.__proto__ && exports.__proto__.name && (
            exports.__proto__.name == "PureComponent" || exports.__proto__.name == "Component"
        )) {
            return "reactComponents"
        }
        if (exports.$$typeof) {
            return "reactComponents"
        }
        if (typeof exports == "function" || (exports.__esModule && typeof exports.default == "function")) {
            return "functions"
        }
        if (typeof exports == "string") {
            return exports.indexOf("svg") > -1 ? "svg" : "strings"
        }
        if (exports.__esModule && typeof exports.default == "string") {
            return exports.default.indexOf("svg") > -1 ? "svg" : "strings"
        }

        if (typeof exports == "symbol" || typeof exports == "boolean") {
            return "objects"
        }

        return null
    }

    let commonOutput = { objects: {} }
    for (const i in vivaldi.jdhooks._modules) {
        const idx = parseInt(i)
        if (isNaN(idx)) continue

        const name = vivaldi.jdhooks._moduleNames[idx] || i

        let exports = vivaldi.jdhooks.require(idx)
        if (!exports) continue
        if (exports == vivaldi) continue
        if (exports == chrome) continue
        if (exports == window) continue

        const prename = xtoa(exports)
        if (prename) {
            commonOutput[prename] = { ...commonOutput[prename] || {}, ...{ [name]: exports } }
        } else if (exports.DOCUMENT_TYPE_NODE) {
            commonOutput.objects[name] = exports.toString()
        } else if (typeof exports == "object") {
            for (; exports && !exports.valueOf; exports = exports.__proto__) {
                for (const k of Object.getOwnPropertyNames(exports)) {
                    commonOutput.objects[name] = commonOutput.objects[name] || {}
                    try {
                        commonOutput.objects[name][k] = exports[k]
                    } catch (e) {
                        console.debug(e)
                    }
                }
            }
        } else {
            console.log("unknown type", typeof exports, exports)
        }
    }
    return { modules: commonOutput, classes: Object.values(vivaldi.jdhooks._dbg_classNameCache).sort() }
}