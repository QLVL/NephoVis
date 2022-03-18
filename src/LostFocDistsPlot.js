class LostFocDistsPlot extends LostTokenPlot {
	constructor(level, targetElementName, target, dataset, tailoredContexts,
				dataPointStyles,
				tokenSelection, variableSelection, onDataPointClick) {
		super(level, targetElementName, target, dataset, tailoredContexts,
				dataPointStyles,
				tokenSelection, variableSelection, onDataPointClick);
	}

	codePoint(row, dataPointStyle) {
		if (dataPointStyle.style == "shape") {
			// Symbol exclusive to the focdists plot
			return d3.symbolStar;
		} else {
			return super.codePoint(row, dataPointStyle);
		}
	}

}