class TokenPlot extends CommonTokenPlot {
	constructor(level, targetElementName, dimensions, dataset, chosenSolution, contextVar,
				tailoredContexts,
				dataPointStyles, modelSelection, tokenSelection,
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

		this.appendSvg();

		// I need to add "model" here (even though it belongs to miniplot) because the initPlot()
		// will kick off an entire chain from the constructor (and I cannot stop it)

		this.initPlot();
	}
}