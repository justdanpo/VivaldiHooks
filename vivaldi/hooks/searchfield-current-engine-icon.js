//Current search engine icon in SearchField

vivaldi.jdhooks.hookClass('SearchField', function(reactClass) {

    //hide old button
    var style = document.createElement('style');
    style.setAttribute('description', 'added by searchfield-current-engine-icon.js');
    style.textContent = "div.searchfield > span > button.search-engines { display: none }";
    document.head.appendChild(style);


    vivaldi.jdhooks.hookMember(reactClass, 'render', null, function(hookData) {

        var searchFieldRenderedObject = hookData.retValue;

        var React = vivaldi.jdhooks.require('react_React');

        var searchEngine = this.props.currentSearchEngine ? this.props.currentSearchEngine : this.props.searchEngines[0] ? this.props.searchEngines[0] : null;
        if (searchEngine) {

            var dropdownIsExpanded;

            var searchDropdownObjectIndex = searchFieldRenderedObject.props.children.findIndex(function(e) {
                return e.ref == "searchEngines"
            })

            //insert new button
            searchFieldRenderedObject.props.children.splice(searchDropdownObjectIndex + 1, 0,
                React.createElement('button', {
                        className: "button-addressfield searchfield-current-engine",
                        style: {
                            display: "flex",
                        },
                        onClick: function(event) {
                            if (!dropdownIsExpanded) this.refs.searchEngines.expand();
                        }.bind(this),
                        onMouseDown: function(event) {
                            dropdownIsExpanded = this.refs.searchEngines.isExpanded();
                        }.bind(this)

                    },
                    React.createElement("img", {
                        className: "searchfield-current-engine-icon",
                        src: searchEngine.FaviconUrl ? searchEngine.FaviconUrl : "chrome://favicon/origin/" + searchEngine.Url,
                        style: {
                            margin: "auto",
                            width: 16,
                            height: 16
                        }
                    }),
                    React.createElement("span", {
                        className: "searchfield-current-engine-dropdown",
                        dangerouslySetInnerHTML: {
                            __html: vivaldi.jdhooks.require('_svg_btn_dropdown')
                        },
                        style: {
                            margin: "auto",
                            width: 16,
                            height: 16
                        }
                    })
                ) //React.createElement('button'
            ); //searchFieldRenderedObject.props.children.splice
        }

        return searchFieldRenderedObject;
    });

});