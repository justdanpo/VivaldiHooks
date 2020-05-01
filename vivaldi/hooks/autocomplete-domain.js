//Autocomplete to domain first
//Автодополнение сперва предлагает домен

vivaldi.jdhooks.hookClass("urlfield_AutocompleteInput_AutocompleteInput", oldClass => {
	const url = vivaldi.jdhooks.require("url")

	return class extends oldClass {
		constructor(...e) { super(...e) }

		static getDerivedStateFromProps(input, autocompletedata) {
			let r = super.getDerivedStateFromProps(input, autocompletedata)

			if (r.autocompleteItem && r.autocompleteValue) {
				var parsed = url.parse(r.autocompleteValue);
				var host =
					(parsed.protocol
						? parsed.protocol + (parsed.slashes ? "//" : "")
						: ""
					)
					+ (parsed.hostname ? parsed.hostname : "")
					+ (parsed.pathname ? parsed.pathname.replace(/^(.*?\/).*/, "$1") : "");

				if (r.typedValue.length < host.length) {
					r.autocompleteValue = host
					r.autocompleteItem = false
				}
			}
			return r
		}
	}
})
