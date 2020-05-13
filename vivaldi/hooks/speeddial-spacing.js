// Change SD tiles geometry (spacing etc.)

vivaldi.jdhooks.hookClass('speeddial_SpeedDialView', cls => {
    // Could be avoided by using just strings instead of calling this
    const R = vivaldi.jdhooks.require('_PrefKeys');
    const settings = vivaldi.jdhooks.require('vivaldiSettings');
    class newSDView extends cls {
        constructor(...e) {
            super(...e);

            // To get the original code, search for getSpeedDialGeometry, it’s
            // just a few matches
            this.getSpeedDialGeometry = () => {
                let sets = {
                    ...{
                        widthHeightRatio: 1.2,
                        spacing: 5,
                        edgeMargin: 15
                    },
                    ...settings.getSync(['SPEEDDIAL_SIZING'])
                };
                let width = this.props.prefValues[R.kStartpageSpeedDialWidth];
                // Adjust size automatically
                if (width === -1) {
                    const t = Math.round(this.props.maxWidth / (1.0 * this.props.prefValues[R.kStartpageSpeedDialColumns]));
                    width = Math.max(Math.min(t, 320), 120)
                }
                const height = Math.round(width / sets['widthHeightRatio']),
                    spacing = sets['spacing'];
                let count = this.state.dialNodes.length;
                // One more for the ‘plus’ tile
                this.props.prefValues[R.kStartpageSpeedDialAddButtonVisible] && count++;
                const totWidth = width + 2 * spacing;
                let totHeight = height + 2 * spacing;
                // Add space for titles
                "never" !== this.props.prefValues[R.kStartpageSpeedDialTitlesVisible] && (totHeight += 30);
                const margin = sets['edgeMargin'],
                    maxCols = this.props.prefValues[R.kStartpageSpeedDialColumns] || 1000;
                let cols = Math.max(1, Math.min(Math.floor((this.props.maxWidth - margin) / totWidth), maxCols));
                return this.props.maxWidth < totWidth * cols + margin && (cols = 1), {
                    count: count,
                    cols: cols,
                    rows: Math.ceil(count / cols),
                    dialWidth: totWidth,
                    dialHeight: totHeight,
                    thumbnailWidth: width,
                    thumbnailHeight: height,
                    dialSpace: spacing
                }
            };
        }
    }
    return newSDView;
});

// Settings
vivaldi.jdhooks.hookClass('settings_startpage_StartPage', cls => {
    const React = vivaldi.jdhooks.require('React');
    const settings = vivaldi.jdhooks.require('vivaldiSettings');
    const settSrchCatChild = vivaldi.jdhooks.require('settings_SettingsSearchCategoryChild');
    // const PrefKeys = vivaldi.jdhooks.require('_PrefKeys');
    // const PrefSet = vivaldi.jdhooks.require('_PrefSet');

    function setProperty(obj, name, value) {
        if (name in obj) Object.defineProperty(obj, name, { value: value, enumerable: true, configurable: true, writable: true }); else obj[name] = value
    }
    class TilesSection extends React.Component {
        constructor(...e) {
            super(...e);

            setProperty(this, 'state', {
                ...{
                    widthHeightRatio: 1.2,
                    spacing: 5,
                    edgeMargin: 15
                },
                ...settings.getSync(['SPEEDDIAL_SIZING'])
            });
        }

        updateCustomSettings() {
            settings.set({['SPEEDDIAL_SIZING']: {
                widthHeightRatio: this.state.widthHeightRatio,
                spacing: this.state.spacing,
                edgeMargin: this.state.edgeMargin
            }});
        }

        onInputChanged(setting, inputProperty, parseFunction, event) {
            if (event.target && event.target[inputProperty] !== undefined) {
                let newState = {};
                newState[setting] = parseFunction.call(this, [event.target[inputProperty]]);
                this.setState(newState, () => (this.updateCustomSettings()));
            }
        }

        render() {
            return React.createElement(settSrchCatChild,
                { filter: this.props.filter },
                React.createElement('div', { className: 'setting-group' },
                    React.createElement('div', { className: 'setting-single' },
                        React.createElement('h3', null, 'Width to Height Ratio'),
                        React.createElement('input', {
                            type: 'range',
                            min: 0.5,
                            max: 2,
                            step: 0.1,
                            value: this.state.widthHeightRatio,
                            onChange: this.onInputChanged.bind(this, 'widthHeightRatio', 'value', parseFloat),
                            tabIndex: -1
                        }),
                        React.createElement('span', null, this.state.widthHeightRatio.toString())),
                    React.createElement('div', { className: 'setting-single' },
                        React.createElement('h3', null, 'Spacing between Tiles'),
                        React.createElement('input', {
                            type: 'range',
                            min: 0,
                            max: 100,
                            step: 1,
                            value: this.state.spacing,
                            onChange: this.onInputChanged.bind(this, 'spacing', 'value', parseInt),
                            tabIndex: -1
                        }),
                        React.createElement('span', null, this.state.spacing.toString() + 'px')),
                    React.createElement('div', { className: 'setting-single' },
                        React.createElement('h3', null, 'Margin on the Sides'),
                        React.createElement('input', {
                            type: 'range',
                            min: 0,
                            max: 200,
                            step: 5,
                            value: this.state.edgeMargin,
                            onChange: this.onInputChanged.bind(this, 'edgeMargin', 'value', parseInt),
                            tabIndex: -1
                        }),
                        React.createElement('span', null, this.state.edgeMargin.toString() + 'px'))
                )
            );
        }
    }

    class newCls extends cls {
        constructor(...e) {
            super(...e);
        }
        render() {
            let sp = super.render();
            sp.props.children[1].props.children.push(React.createElement(TilesSection, this.props));
            console.log(sp);
            return sp;
        }
    }
    return newCls;
});
