class LostTokenPlot extends TokenPlot {
	constructor(level, targetElementName, target, dataset, contextVar, tailoredContexts,
				dataPointStyles,
				tokenSelection, variableSelection, onDataPointClick) {
		let modelSelection = null;
		let selectionByLegend = null;
		let chosenSolution = null;

		super(level, targetElementName, {}, dataset, chosenSolution, contextVar,
				tailoredContexts,
				dataPointStyles, modelSelection, tokenSelection,
				variableSelection, onDataPointClick, null, selectionByLegend, false)

		this.dimensions["width"] = parseInt(this.targetElement.style("width"));
		this.dimensions["padding"] = 20;


		// todo: dots per row doesn't scale when sidebar width is changed	
	    this.dotsPerRow = Math.floor((this.dimensions["width"] - this.dimensions["padding"]) / 10);
	    this.dotsColumns = Math.ceil(this.dataset.length / this.dotsPerRow);

	    this.dimensions["height"] = this.dotsColumns * 10 + this.dimensions["padding"] / 2;

		this.target = target;

		this.idColumn = "_id";
		this.selection = this.tokenSelection;

		this.initPlot();
		this.generateLostTokens();
	}

	initPlot() {
	}

	generateLostTokens() {

	    let lostItem = "TODO"; // tokens or FOCs?

	    // Add DOM elements
	    this.targetElement.append("hr");
	    this.targetElement.append("h5")
	    	   			 .text(`Lost ${this.target}`);

	    // We need to add a container div to hold the tooltip
	    this.targetElement = this.targetElement.append("div")
	    									   .style("position", "relative");

	   	// Add the lost tokens
    	this.svg = this.targetElement.append("svg")
      					 .attr("width", this.dimensions["width"])
      					 .attr("height", this.dimensions["height"])
      					 .attr("transform", "translate(0,0)")

      	this.svgPlot = this.svg;
      	
      	// Add point cloud coordinates for re-use for the tooltips
		this.generatePointCloudCoordinates();

      	this.pointCloud = this.svg.append("g")
      					 	 .attr("transform", `translate(${10},${10})`)
      					 	 .attr("class", "dot")
      					 	 .selectAll("path")
      					 	 .data(this.dataset)
      					 	 .enter()
      					 	 .append("path")
      					 	 .attr("class", "graph lost")
      					 	 .attr("transform", (row, index) => this.generatePointCloudElementTransform(index))
      					 	 .attr("pointIndex", (row, index) => index);
      		   //.call(styleDot, settings, target);

      	this.stylePoints(this.pointCloud);
      	this.applyEvents(this.pointCloud);
	}

	// Special data point scaler for lost foc dist plot
	scaleDataPoint(row) {
		let j = Math.floor(this.dataset.indexOf(row) / this.dotsPerRow);
		let i = this.dataset.indexOf(row) - (j * this.dotsPerRow);

		return [ i * 10, j * 10 ];
	}

	drawLegend() {
		return;
	}
}