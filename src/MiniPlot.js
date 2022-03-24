class MiniPlot extends TokenPlot {
	constructor(level, targetElementName, model, dimensions, dataset, chosenSolution, contextVar,
				dataPointStyles, modelSelection, tokenSelection,
				variableSelection, onDataPointClick, brushEndCallback, selectionByLegend, standalone=true) {
		super(level, targetElementName, dimensions, dataset, chosenSolution, contextVar,
				null,
				dataPointStyles, modelSelection, tokenSelection,
				variableSelection, onDataPointClick, brushEndCallback, selectionByLegend,
				standalone, model, dimensions["padding"]);
	}

	// Automatically set coordinates source to the chosen solution when chosen solution changes
	set chosenSolution(chosenSolution) {
		this._chosenSolution = chosenSolution;
		this.coordinatesSource = `${this.model}-${this._chosenSolution}`;
	}

	initPlot() {
		super.initPlot();
		this.setTitle();
		this.setNumberEmblem()
	}

	setTitle() {
		this.svg.append("text")
      			.attr("x", this.dimensions["padding"] * 1.5)
      			.attr("y", this.dimensions["padding"])
      			.attr("dy", "-0.5em")
      			.attr("font-size", "0.7em")
      			.style("cursor", "pointer")
      			.text(this.model.length > 40 ?
      				  this.model.substring(0, 37) + "..." :
      				  this.model)
      			.on("click", d => { console.log("TODO open level 3"); });
	}

	setNumberEmblem() {
    	// Show number of model
    	this.emblem = this.svg.append("circle")
      						  .attr("cx", this.dimensions["padding"])
      						  .attr("cy", this.dimensions["padding"])
      						  .attr("r", this.dimensions["padding"] * 0.6)
      						  .on("mouseover", () => { this.mouseOverEmblem(); } )
      						  .on("mouseout", () => { this.mouseOutEmblem(); } );

    	this.svg.append("text")
    	  		.attr("x", this.dimensions["padding"])
    	  		.attr("y", this.dimensions["padding"])
    	  		.attr("dx", "-0.3em")
    	  		.attr("dy", "0.3em")
    	  		.text(this.modelSelection.models.indexOf(this.model) + 1)
    	  		.style("fill", "white")
    	  		.style("font-weight", "bold")
    	  		.style("font-size", "0.8em");
	}

	setPointerEvents() {
		super.setPointerEvents();
		this.svgContainer = this.svgContainer.attr("x", this.dimensions["padding"])
      										 .attr("y", this.dimensions["padding"])
      										 .attr("width", this.dimensions["width"] - this.dimensions["padding"])
      										 .attr("height", this.dimensions["height"] - this.dimensions["padding"])
											 .style("stroke", "gray")
											 .style("stroke-width", 0.6);
	}

	mouseOverEmblem() {

	}

	mouseOutEmblem() {
		
	}
}