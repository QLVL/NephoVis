class FocDistsPlot extends BaseTokenPlot {
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

		// Set the plot identity so brushes can toggle
		this.plotType = "focdists";

		this.sizeDataStyle = new DataPointStyle(this.level, "size", null);
		this.sizeDataStyle.assign("waaa", []); // generate schema (bit of a hack)

		this.initPlot();
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
		switch (dataPointStyle.style) {
			case "shape":
				return d3.symbolStar;
				break;
			case "size":
				if (this.selection.items.includes(row[this.idColumn])) {
					return this.sizeDataStyle.schema.domain([1, this.selection.count])(
						this.tooltipGenerator.countTokens(row[this.idColumn]));
				}
				else {
					return this.sizeDataStyle.default_value;
				}
			default:
				return super.codePoint(row, dataPointStyle);
				break;
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