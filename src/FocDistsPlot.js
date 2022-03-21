class FocDistsPlot extends TokenPlot {
	constructor(level, targetElementName, dimensions, dataset, chosenSolution, contextVar,
				tailoredContexts,
				dataPointStyles, modelSelection, tokenSelection,
				variableSelection, onDataPointClick, brushEndCallback, selectionByLegend) {
		super(level, targetElementName, dimensions, dataset, chosenSolution, contextVar,
				tailoredContexts,
				dataPointStyles, modelSelection, tokenSelection,
				variableSelection, onDataPointClick, brushEndCallback, selectionByLegend);
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
		this.highlightPoint(pointElement);
	}

	drawLegend() {
		return;
	}
}