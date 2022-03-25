class CommonTokenPlot extends Plot {
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
				brushEndCallback,
				selectionByLegend) {

		// Pass arguments to the Plot parent class
		super(level,
			  targetElementName,
			  dimensions,
			  dataset,
			  dataPointStyles,
			  modelSelection,
			  variableSelection,
			  onDataPointClick,
			  selectionByLegend);

		this.brushEndCallback = brushEndCallback;
		this.chosenSolution = chosenSolution; // TODO: this will still cause issues with getter/setter
		this.originalDataset = this.dataset;
		this.contextVar = contextVar;
		this.tailoredContexts = tailoredContexts;
		this.tokenSelection = tokenSelection;

		this.idColumn = "_id";
		this.selection = this.tokenSelection;
	}

	/* -- GETTERS AND SETTERSE -- */

	get chosenSolution() {
		return this._chosenSolution;
	}

	// Automatically set coordinates source to the chosen solution when chosen solution changes
	set chosenSolution(chosenSolution) {
		this._chosenSolution = chosenSolution;
		this.coordinatesSource = this.chosenSolution;
	}

	/* -- MOUSE OVER, MOUSE OUT -- */

	mouseOverPoint(row, pointElement) {
		d3.select("#concordance").html("")
		this.highlightPoint(pointElement);

		this.showContext(row, pointElement);
	}

	mouseOut() {
		super.mouseOut();
		d3.select("#concordance").html("");
	}

	showContext(row, pointElement) {
		let tooltipColour = this.codePoint(row, this.dataPointStyles["colour"]);

		// ? ? ? ?
		/*if (this.tailoredContexts.filter(context => context.value == this.contextVar).length == 0)
		{
			// todo, I don't know what this is or what it should do
		}*/

		let tooltipTitle = `<p><b>${row["_id"]}</b></p><p>`;
		let tooltipInfo = row[this.contextVar].replace(/class=["']target["']/g,
							`style="color:${tooltipColour};font-weight:bold;"`) + "</p>";

		d3.select("#concordance")
		  .append("p")
		  .attr("class", "text-center p-2 ml-2")
		  .style("border", "solid")
		  .style("border-color", "gray")
		  .style("font-size", "0.8em")
		  .html(tooltipTitle + tooltipInfo);
	}

	/* -- BRUSH -- */

	onBrush() {
		let event = d3.event.selection;

		if (event == null) {
			return;
		}

		this.tokenSelection.clear(false);

		this.pointCloudElements.classed("lighter", (row, index, pointElements) =>
			{
				let pointElement = d3.select(pointElements[index]);
				let position = this.pointCloudCoordinates[+pointElement.attr("pointIndex")];

				// Do not ask what this is. It works. It is perfect as it is. Do not question.
				let inSelection = !((position[0] < event[0][0] + this.dimensions["padding"] ||
						 			 position[0] > event[1][0] + this.dimensions["padding"] ||
						 			 position[1] < event[0][1] + this.dimensions["padding"] ||
						 			 position[1] > event[1][1] + this.dimensions["padding"]) &&
						 			 Helpers.existsFromColumn(row, this.chosenSolution));

				// If we can already create the selection on the fly, it's easier to return it on brush end
				if (inSelection) {
					this.tokenSelection.add(row["_id"], false);
				}

				return !inSelection;
			});
	}

	onBrushEnd() {
		this.brushEndCallback(this.tokenSelection.tokens);
	}

	applyBrush(brush) {
		brush = brush.on("start", () => { console.log("Brush start") })
					 .on("brush", () => this.onBrush())
					 .on("end", () => this.onBrushEnd());

		this.svg.append("g")
        		.attr("transform", `translate(${this.dimensions["padding"]}, ${this.dimensions["padding"]})`)
        		.attr("class", "brush")
        		.call(brush);
	}

	/* -- OTHER -- */

	isPointSelected(row) {
		if (this.tokenSelection.tokens.length > 0)
		{
			return this.tokenSelection.tokens.includes(row["_id"]);
		}

		return true;
	}

	updateContextVar(contextVar) {
		this.contextVar = contextVar;
	}

	switchSolution(chosenSolution) {
		this.chosenSolution = chosenSolution;

		this.updatePointCloud();
	}

}