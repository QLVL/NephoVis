class FocDistsPlot extends TokenPlot {
	constructor(level, targetElementName, dimensions, dataset, tokenDataset, chosenSolution, contextVar,
				contextWordsColumn, tailoredContexts, dataPointStyles, modelSelection, tokenSelection,
				variableSelection, onDataPointClick, brushEndCallback, selectionByLegend) {
		super(level,
			  targetElementName,
			  dimensions,
			  dataset,
			  chosenSolution,
			  contextVar,
			  tailoredContexts,
			  dataPointStyles,
			  modelSelection,
			  tokenSelection,
			  variableSelection,
			  onDataPointClick,
			  brushEndCallback,
			  selectionByLegend);

		this.contextWordsColumn = contextWordsColumn;
		this.tokenDataset = tokenDataset;

		this.tooltipGenerator = new FocDistsTooltipGenerator(this.tokenDataset,
															 this.contextWordsColumn);
	}

	initPlot() {
		super.initPlot();
		this.setTooltip();
	}

	setAxes(doTraceCenter=true) {
		this.coordinatesSource = `${this.chosenSolution}cws`;

		super.setAxes(doTraceCenter);
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

	drawLegend() {
		return;
	}
}