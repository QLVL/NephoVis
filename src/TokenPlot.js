class TokenPlot extends Plot {
	constructor(level, targetElementName, dimensions, dataset, chosenSolution, contextVar,
				tailoredContexts,
				dataPointStyles, modelSelection, tokenSelection,
				variableSelection, onDataPointClick, selectionByLegend, standalone=true) {
		super(level, targetElementName, dimensions, dataset, dataPointStyles,
				modelSelection, variableSelection, onDataPointClick, selectionByLegend);

		if (standalone)
			this.appendSvg();

		this.chosenSolution = chosenSolution;
		this.originalDataset = this.dataset;
		this.contextVar = contextVar;
		this.tailoredContexts = tailoredContexts;
		this.tokenSelection = tokenSelection;

		this.idColumn = "_id";
		this.selection = this.tokenSelection;

		this.initPlot();
	}

	initPlot() {
		super.initPlot();
	}

	setAxes() {
		this.coordinatesSource = this.chosenSolution;

		super.setAxes();
	}

	mouseOverPoint(row, pointElement) {
		d3.select("#concordance").html("")
		this.highlightPoint(pointElement);

		this.showContext(row, pointElement);
	}

	mouseOut() {
		super.mouseOut();
		d3.select("#concordance").html("");
	}

	isPointSelected(row) {
		if (this.tokenSelection.tokens.length > 0)
		{
			return this.tokenSelection.tokens.includes(row["_id"]);
		}

		return true;
	}

	showContext(row, pointElement) {
		let tooltipColour = this.codePoint(row, this.dataPointStyles["colour"]);

		// todo ? ? ? 
		let contextVar = this.contextVar || "_ctxt.raw";

		// ? ? ? ?
		if (this.tailoredContexts.filter(context => context.value == contextVar).length == 0)
		{
			// todo, I don't know what this is or what it should do
		}

		let tooltipTitle = `<p><b>${row["_id"]}</b></p><p>`;
		let tooltipInfo = row[contextVar].replace(/class=["']target["']/g,
							`style="color:${tooltipColour};font-weight:bold;"`) + "</p>";

		d3.select("#concordance")
		  .append("p")
		  .attr("class", "text-center p-2 ml-2")
		  .style("border", "solid")
		  .style("border-color", "gray")
		  .style("font-size", "0.8em")
		  .html(tooltipTitle + tooltipInfo);
	}
}