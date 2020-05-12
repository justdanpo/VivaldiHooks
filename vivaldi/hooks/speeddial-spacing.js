// Change SD tiles geometry (spacing etc.)

vivaldi.jdhooks.hookClass('speeddial_SpeedDialView', cls => {
    // Could be avoided by using just strings instead of calling this
    const R = vivaldi.jdhooks.require('_PrefKeys');
    class newSDView extends cls {
        constructor(...e) {
            super(...e);

            // Mostly copy-pasted code, just a few adjusted values and renamed
            // variables
            // To get the original code, search for getSpeedDialGeometry, it’s
            // just a few matches
            this.getSpeedDialGeometry = () => {
                let width = this.props.prefValues[R.kStartpageSpeedDialWidth];
                // Adjust size automatically
                if (width === -1) {
                    const t = Math.round(this.props.maxWidth / (1.0 * this.props.prefValues[R.kStartpageSpeedDialColumns]));
                    width = Math.max(Math.min(t, 320), 120)
                }
                const height = Math.round(width / 1.2222),
                    spacing = 5;
                let count = this.state.dialNodes.length;
                // One more for the ‘plus’ tile
                this.props.prefValues[R.kStartpageSpeedDialAddButtonVisible] && count++;
                const totWidth = width + 2 * spacing;
                let totHeight = height + 2 * spacing;
                // Add space for titles
                "never" !== this.props.prefValues[R.kStartpageSpeedDialTitlesVisible] && (totHeight += 30);
                const margin = 2 * spacing,
                    maxCols = this.props.prefValues[R.kStartpageSpeedDialColumns];
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
