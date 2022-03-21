class LostFocDistsPlot extends LostTokenPlot {
	constructor(level, targetElementName, target, dataset, tokenDataset, 
				contextWordsColumn, tailoredContexts, dataPointStyles,
				tokenSelection, variableSelection, onDataPointClick) {

		super(level, targetElementName, target, dataset, null, tailoredContexts,
				dataPointStyles,
				tokenSelection, variableSelection, onDataPointClick);

		this.tokenDataset = tokenDataset;
		this.contextWordsColumn = contextWordsColumn;
		this.tooltipGenerator = new FocDistsTooltipGenerator(this.tokenDataset,
															 this.contextWordsColumn);

		this.setTooltip(this.targetElement);
	}

	codePoint(row, dataPointStyle) {
		if (dataPointStyle.style == "shape") {
			// Symbol exclusive to the focdists plot
			return d3.symbolStar;
		} else {
			return super.codePoint(row, dataPointStyle);
		}
	}

	mouseOverPoint(row, pointElement) {
		this.showTooltip(row, pointElement);
		this.highlightPoint(pointElement);
	}

	mouseOut() {
		super.mouseOut();
		this.hideTooltip();
	}

	generateTooltipContent(row) {
		return this.tooltipGenerator.generate(row);
	}
}