class LostTokenPlot extends CommonTokenPlot {
	constructor(level,
				targetElementName,
				target,
				dataset,
				contextVar,
				tailoredContexts,
				dataPointStyles,
				tokenSelection,
				variableSelection,
				onDataPointClick) {

		// These go unused. I don't know whether this is bad design.
		// Would be quite a hassle to rework everything. OOP is fun.
		// TODO: figure out a way to streamline this, should it be necessary
		let modelSelection = null;
		let brushStartCallback = null;
		let brushEndCallback = null;
		let selectionByLegend = null;
		let chosenSolution = null;

		// Call to the CommonTokenPlot parent class
		super(level,
			  targetElementName,
			  {},
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

		// Computing plot dimensions
		// The dimensions of this plot are not fixed. This is why we cannot pass them to the
		// parent constructor call.
		this.dimensions["width"] = parseInt(this.targetElement.style("width"));
		this.dimensions["padding"] = 20;


		// TODO: dots per row doesn't scale when sidebar width is changed	
	    this.dotsPerRow = Math.floor((this.dimensions["width"] - this.dimensions["padding"]) / 10);
	    this.dotsColumns = Math.ceil(this.dataset.length / this.dotsPerRow);

	    this.dimensions["height"] = this.dotsColumns * 10 + this.dimensions["padding"] / 2;

	    // "Target" describes whether this lost token plot is for tokens or FOCs
		this.target = target;

		// This is the central identity column which is used for row lookup
		this.idColumn = "_id";

		// Can be either a model or token selection
		// Used in parent classes to find out whether data points belong to a user selection
		this.selection = this.tokenSelection;

		// There is no initPlot call since this is not needed for this type of plot
		// We geneate lost tokens directly
		this.generateLostTokens();
	}

	generateLostTokens() {
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

      	// SVG plot is a separate element for most plots
      	// We still need to set it, because it is used for tooltips
      	this.svgPlot = this.svg;
      	
      	// Add point cloud coordinates for re-use for the tooltips
		this.generatePointCloudCoordinates();

		// Generate the point cloud for the lost tokens
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

      	// Style the points, and enable mouse overs etc
      	this.stylePoints(this.pointCloud);
      	this.applyEvents(this.pointCloud);
	}

	// Special data point scaler for lost foc dist plot
	scaleDataPoint(row) {
		let j = Math.floor(this.dataset.indexOf(row) / this.dotsPerRow);
		let i = this.dataset.indexOf(row) - (j * this.dotsPerRow);

		return [ i * 10, j * 10 ];
	}

	// We need to disable the legend for lost token plots, because the legend will interfere
	// with the legend for the main lost token plot
	drawLegend() {
		return;
	}
}