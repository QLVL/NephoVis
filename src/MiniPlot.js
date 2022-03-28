class MiniPlot extends CommonTokenPlot {
	constructor(level,
				targetElementName,
				model,
				dimensions,
				dataset,
				lostDataset,
				modelDataset,
				chosenSolution,
				contextVar,
				dataPointStyles,
				modelSelection,
				tokenSelection,
				variableSelection,
				onDataPointClick,
				onDataPointMouseOver,
				onDataPointMouseOut,
				showTooltipCallback,
				hideTooltipCallback,
				brushStartCallback,
				onBrushCallback,
				brushEndCallback,
				selectionByLegend,
				modelClickCallback) {

		// Unused
		let tailoredContexts = null;

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

		this.viewBoxPadding = this.dimensions["padding"];
		this.model = model;
		this.lostDataset = lostDataset;
		this.modelDataset = modelDataset;

		// We need a separate onBrush callback for the miniplots, since token selection needs to update immediately
		// in the other plots as well
		this.onBrushCallback = onBrushCallback;

		// We need to know when a brush starts, so we can potentially remove the brush active in another plot
		this.onBrushStartCallback = brushStartCallback;

		// When we hover over a data point, we want to also highlight that same point in all other plots
		// For this, we need more callbacks
		this.onDataPointMouseOverCallback = onDataPointMouseOver;
		this.onDataPointMouseOutCallback = onDataPointMouseOut;

		// We need to be able to spawn tooltips outside the plot, so we also have callbacks for this
		this.showTooltipCallback = showTooltipCallback;
		this.hideTooltipCallback = hideTooltipCallback;

		// The URL is generated at the application level
		this.modelClickCallback = modelClickCallback;

		// We have to re-do this, because the chosenSolution setter (which is called in the parent class)
		// will not have had access to this.model information, so we need to set this property again.
		this.chosenSolution = chosenSolution;

		// We also have to append an extra SVG for this type of plot
		this.appendSvg();

		// Now, we can initialise the mini plot
		this.initPlot();
	}

	// Automatically set coordinates source to the chosen solution when chosen solution changes
	set chosenSolution(chosenSolution) {
		this._chosenSolution = chosenSolution;
		this.coordinatesSource = `${this.model}-${this._chosenSolution}`;
	}

	initPlot() {
		super.initPlot();
		this.setTitle();
		this.setNumberEmblem();
		this.colourEmblem();
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
      			.on("click", () => { this.modelClickCallback(this.model); });
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
    	  		.style("font-size", "0.8em")
    	  		.style("pointer-events", "none");
	}

	restyle(dataPointStyles) {
		super.restyle(dataPointStyles);
		this.stylePoints(this.lostPointCloud);
		this.colourEmblem();
	}

	colourEmblem() {
		// Find the row corresponding to the model of this plot
		let row = this.modelDataset.filter(row => row["_model"] == this.model)[0];
		// Code the element using the emblem datapoint style
		this.emblem.style("fill", this.codePoint(row, this.dataPointStyles["emblem"]));
	}

	generatePointCloud() {
		super.generatePointCloud();

		this.lostPointCloud = this.svg.append("g")
				.attr("transform", `translate(${this.dimensions["width"] + this.dimensions["padding"] / 4}, 
											  ${this.dimensions["padding"] / 2})`)
				.attr("class", "lostdot")
      			.selectAll("path")
      			.data(this.lostDataset)
      			.enter()
      			.append("path")
      			.attr("class", "graph")
      			.attr("pointIndex", (row, index) => index)
      			.attr("transform", (row, index) => {
        			let j = index;
        			var i = Math.floor((j * 10) / this.dimensions["width"]);
        			j = j - (i * (this.dimensions["width"] / 10));
        			return (`translate(${i * 10}, ${j * 10})`); });

      	this.applyEvents(this.lostPointCloud);

      	this.stylePoints(this.lostPointCloud);
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

	onBrushStart() {
		// Inform the parent NephoVis class that brushing for this plot has started
		this.onBrushStartCallback(this.model);
	}

	onBrush() {
		super.onBrush();

		this.onBrushCallback(this.tokenSelection.tokens);
	}

	mouseOverPoint(row, pointElement) {
		this.showContext(row, pointElement);

		// We give the point index to the callback, so it can find the corresponding point element
		// in the other plots
		this.onDataPointMouseOverCallback(row[this.idColumn]);
	}

	mouseOut(doCallback=true) {
		super.mouseOut();

		if (doCallback) {
			this.onDataPointMouseOutCallback();
		}
	}

	mouseOverEmblem() {
		this.showTooltipCallback(this.model);
	}

	mouseOutEmblem() {
		this.hideTooltipCallback();	
	}
}