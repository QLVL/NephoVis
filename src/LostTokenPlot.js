class LostTokenPlot extends TokenPlot {
	constructor(level, targetElementName, target, dataset, tailoredContexts,
				dataPointStyles,
				tokenSelection, variableSelection, onDataPointClick) {
		let modelSelection = null;
		let selectionByLegend = null;
		let chosenSolution = null;
		let contextVar = null;

		super(level, targetElementName, {}, dataset, chosenSolution, contextVar,
				tailoredContexts,
				dataPointStyles, modelSelection, tokenSelection,
				variableSelection, onDataPointClick, null, selectionByLegend, false)

		this.dimensions["width"] = parseInt(this.targetElement.style("width"));
		this.dimensions["padding"] = 20;

		this.target = target;

		this.idColumn = "_id";
		this.selection = this.tokenSelection;

		this.initPlot();
		this.generateLostTokens();
	}

	initPlot() {
	}

	generateLostTokens() {
		// Delete all lost token overviews
		d3.selectAll(".lost").remove();

		// todo: dots per row doesn't scale when sidebar width is changed	
	    let dotsPerRow = Math.floor((this.dimensions["width"] - this.dimensions["padding"]) / 10);
	    let dotsColumns = Math.ceil(this.dataset.length / dotsPerRow);

	    let lostItem = "TODO"; // tokens or FOCs?

	    // Add DOM elements
	    this.targetElement.append("hr");
	    this.targetElement.append("h5")
	    	   			 .text(`Lost ${this.target}`);

	   	// Add the lost tokens
    	this.svg = this.targetElement.append("svg")
      					 .attr("width", this.dimensions["width"])
      					 .attr("height", dotsColumns * 10 + this.dimensions["padding"] / 2)
      					 .attr("transform", "translate(0,0)")
      					 
      	let tokens = this.svg.append("g")
      					 	 .attr("transform", `translate(${10},${10})`)
      					 	 .attr("class", "dot")
      					 	 .selectAll("path")
      					 	 .data(this.dataset)
      					 	 .enter()
      					 	 .append("path")
      					 	 .attr("class", "graph lost")
      					 	 .attr("transform", (row) => {
      		   				let j = Math.floor(this.dataset.indexOf(row) / dotsPerRow);
        					let i = this.dataset.indexOf(row) - (j * dotsPerRow);
        					return (`translate(${i * 10},${j * 10})`);
      					 });
      		   //.call(styleDot, settings, target);

      	this.stylePoints(tokens);
      	this.applyEvents(tokens);
	}
}