// Change SD tiles geometry (spacing etc.)

vivaldi.jdhooks.hookClass('speeddial_SpeedDialView', cls => {
    // Could be avoided by using just strings instead of calling this
    const PrefKeys = vivaldi.jdhooks.require('_PrefKeys');
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
                let width = this.props.prefValues[PrefKeys.kStartpageSpeedDialWidth];
                // Adjust size automatically
                if (width === -1) {
                    const wth = Math.round(this.props.maxWidth / (1.0 * this.props.prefValues[PrefKeys.kStartpageSpeedDialColumns]));
                    width = Math.max(Math.min(wth, 400), 100);
                }
                const height = Math.round(width / sets['widthHeightRatio']),
                      spacing = sets['spacing'];
                let count = this.state.dialNodes.length;
                // One more for the ‘plus’ tile
                this.props.prefValues[PrefKeys.kStartpageSpeedDialAddButtonVisible] && count++;
                const spacedWidth = width + 2 * spacing;
                let spacedHeight = height + 2 * spacing;
                // Add space for titles
                if (this.props.prefValues[PrefKeys.kStartpageSpeedDialTitlesVisible] !== "never")
                    spacedHeight += 30;
                const margin = sets['edgeMargin'],
                      maxCols = this.props.prefValues[PrefKeys.kStartpageSpeedDialColumns] || 1000;
                let cols = Math.max(
                               1,
                               Math.min(
                                   Math.floor(
                                       (this.props.maxWidth - margin)
                                       / spacedWidth),
                                   maxCols));
                if (this.props.maxWidth < (spacedWidth * cols + margin))
                    cols = 1;
                return {
                    count: count,
                    cols: cols,
                    rows: Math.ceil(count / cols),
                    dialWidth: spacedWidth,
                    dialHeight: spacedHeight,
                    thumbnailWidth: width,
                    thumbnailHeight: height,
                    dialSpace: spacing
                };
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
    const PrefKeys = vivaldi.jdhooks.require('_PrefKeys');
    const PrefSet = vivaldi.jdhooks.require('_PrefSet');

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

        onWidthInputChanged(event) {
            if (event.target && event.target.value !== undefined) {
                let val = parseInt(event.target.value);
                if (val < 100) val = -1;
                PrefSet.set(PrefKeys.kStartpageSpeedDialWidth, val);
            }
        }

        onMaxColsInputChanged(event) {
            if (event.target && event.target.value !== undefined) {
                let val = parseInt(event.target.value);
                if (val < 1) val = 1000;
                PrefSet.set(PrefKeys.kStartpageSpeedDialColumns, val);
            }
        }

        render() {
            let tileWidth = this.props.prefValues[PrefKeys.kStartpageSpeedDialWidth];
            let tileDisplayWidth = tileWidth.toString() + 'px';
            if (tileWidth < 100) {
                tileWidth = 90;
                tileDisplayWidth = 'Auto';
            }
            let maxCols = this.props.prefValues[PrefKeys.kStartpageSpeedDialColumns];
            let maxColsDisplay = maxCols.toString();
            if (maxCols > 20) {
                maxCols = 0;
                maxColsDisplay = 'Auto';
            }
            return React.createElement(settSrchCatChild,
                { filter: this.props.filter },
                React.createElement('div', { className: 'setting-single' },
                    React.createElement('h3', null, 'Maximum Columns'),
                    React.createElement('input', {
                        type: 'range',
                        min: 0,
                        max: 20,
                        step: 1,
                        value: maxCols,
                        onChange: this.onMaxColsInputChanged.bind(this)
                    }),
                    React.createElement('span', null, maxColsDisplay)),
                React.createElement('div', { className: 'setting-single pad-top' },
                    React.createElement('h3', null, 'Width of Tiles'),
                    React.createElement('input', {
                        type: 'range',
                        min: 90,
                        max: 400,
                        step: 10,
                        value: tileWidth,
                        onChange: this.onWidthInputChanged.bind(this)
                    }),
                    React.createElement('span', null, tileDisplayWidth)),
                React.createElement('div', { className: 'setting-single pad-top' },
                    React.createElement('h3', null, 'Width to Height Ratio'),
                    React.createElement('input', {
                        type: 'range',
                        min: 0.5,
                        max: 2,
                        step: 0.1,
                        value: this.state.widthHeightRatio,
                        onChange: this.onInputChanged.bind(this, 'widthHeightRatio', 'value', parseFloat)
                    }),
                    React.createElement('span', null, this.state.widthHeightRatio.toString())),
                React.createElement('div', { className: 'setting-single pad-top' },
                    React.createElement('h3', null, 'Spacing between Tiles'),
                    React.createElement('input', {
                        type: 'range',
                        min: 0,
                        max: 100,
                        step: 1,
                        value: this.state.spacing,
                        onChange: this.onInputChanged.bind(this, 'spacing', 'value', parseInt)
                    }),
                    React.createElement('span', null, this.state.spacing.toString() + 'px')),
                React.createElement('div', { className: 'setting-single pad-top' },
                    React.createElement('h3', null, 'Margin on the Sides'),
                    React.createElement('input', {
                        type: 'range',
                        min: 0,
                        max: 200,
                        step: 5,
                        value: this.state.edgeMargin,
                        onChange: this.onInputChanged.bind(this, 'edgeMargin', 'value', parseInt)
                    }),
                    React.createElement('span', null, this.state.edgeMargin.toString() + 'px'))
            );
        }
    }

    class newCls extends cls {
        constructor(...e) {
            super(...e);
        }
        render() {
            let sp = super.render();
            // TODO: more update-proof way to achieve this
            let arr = sp.props.children[1].props.children[1].props.children;
            arr.shift(); arr.shift();
            let newOptions = React.createElement(TilesSection, this.props);
            arr.unshift(newOptions);
            return sp;
        }
    }
    return newCls;
});
