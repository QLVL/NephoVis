class TokenPlot extends BaseTokenPlot {
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

		this.initPlot();
	}
}