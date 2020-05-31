//Autocomplete to domain first
//Автодополнение сперва предлагает домен

vivaldi.jdhooks.hookClass("urlfield_AutocompleteInput_AutocompleteInput", oldClass => {
	const url = vivaldi.jdhooks.require("url")

	return class extends oldClass {
		static getDerivedStateFromProps(input, autocompletedata) {
			let r = super.getDerivedStateFromProps(input, autocompletedata)

			if (r.autocompleteItem && r.autocompleteValue && -1 === r.autocompleteValue.indexOf(" ")) {
				const parsed = url.parse(r.autocompleteValue)
				const host =
					(parsed.protocol
						? parsed.protocol + (parsed.slashes ? "//" : "")
						: ""
					)
					+ (parsed.hostname ? parsed.hostname : "")
					+ (parsed.pathname ? parsed.pathname.replace(/^(.*?\/).*/, "$1") : "")

				if (r.typedValue.length < host.length) {
					r.autocompleteValue = host
					r.autocompleteItem = false
				}
			}
			return r
		}
	}
})
