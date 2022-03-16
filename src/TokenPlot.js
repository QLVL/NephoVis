class TokenPlot extends Plot {
	constructor(level, targetElementName, dimensions, dataset, chosenSolution, dataPointStyles,
				modelSelection, variableSelection, onDataPointClick, selectionByLegend) {
		super(level, targetElementName, dimensions, dataset, dataPointStyles,
				modelSelection, variableSelection, onDataPointClick, selectionByLegend);
		this.chosenSolution = chosenSolution;
		this.originalDataset = this.dataset;
	}
}