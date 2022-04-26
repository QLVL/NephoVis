class BaseTokenPlot extends CommonTokenPlot {
	constructor(level,
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
				brushStartCallback,	
				brushEndCallback,
				selectionByLegend) {

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
			brushStartCallback,
			brushEndCallback,
			selectionByLegend);

		this.appendSvg();

		// Set the plot identity so brushes can toggle
		this.plotType = "token";
	}

	onBrushStart() {
		// Inform the parent NephoVis class that brushing for this plot has started
		this.onBrushStartCallback(this.plotType);
	}
}