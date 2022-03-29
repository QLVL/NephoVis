class Plot {
	constructor(level,
				targetElementName,
				dimensions,
				dataset,
				dataPointStyles,
				modelSelection,
				variableSelection,
				onDataPointClick,
				selectionByLegend) {

		this.level = level;

		// Save the correct dataset
		this.dataset = dataset;
		this.dataPointStyles = dataPointStyles;
		this.modelSelection = modelSelection;
		this.variableSelection = variableSelection;
		this.onDataPointClick = onDataPointClick;
		this.selectionByLegend = selectionByLegend;

		// Set plot-wide scale
		this.scale = 1.05;

		// Time-out for the tooltip
		this.tooltipTimeoutDuration = 200;

		console.log(targetElementName);

		// Find the svg element which we will plot to
		this.targetElement = d3.select(`#${targetElementName}`);
		// Clear target element contents
		this.targetElement.html("");

		// Make the target element have position: relative!
		// Needs to be relative for position: absolute of tooltips to make sense
		// Position: absolute = relative to first relative parent
		this.targetElement.style("position", "relative");

		// Save the dimensions
		this.dimensions = dimensions;

		this.animationDuration = 1000;
		this.tooltipOffset = 10;

		this.legendPadding = this.dimensions["padding"];
		this.viewBoxPadding = 0;
	}

	appendSvg() {
		console.log(this.dimensions["height"], this.viewBoxPadding);

		// Create a new SVG element
		this.svgPlot = this.targetElement.append("svg")
					.attr("viewBox", `0 0 ${this.dimensions["height"] + this.viewBoxPadding} 
										  ${this.dimensions["width"] + this.viewBoxPadding}`) // set w & h
					.attr("preserveAspectRatio", "xMinYMin meet")
					.classed("svgPlot", this.level == "model")

		this.svg = this.svgPlot.append("g") // add SVG group
							   .attr("transform", "translate(0, 0)")
							   .call(d3.zoom().on('zoom', this.onZoom));
	}

	initPlot() {
		this.setPointerEvents();

		// Initialise the plot axes
		// These are based on the value range and the physical available pixel estate
		this.setAxes();

		// Add the data points to the plot
		this.generatePointCloud();

		this.updateSelection();

		this.drawLegend();
	}

	drawLegend() {
		this.legend = new Legend(this.dataset, this.level, this.type, this.selection, this.idColumn,
								 this.dataPointStyles, this.legendPadding, this.selectionByLegend);
	}

	onZoom(idk) {
		// todo implement zooming
	}

	setTooltip() {
		this.tooltip = new Tooltip(this.targetElement, this.tooltipOffset);	
	}

	setPointerEvents() {
		this.svgContainer = this.svg.append("rect")
        		.attr("viewBox", `0 0 ${this.dimensions["height"]} ${this.dimensions["width"]}`)
        		.classed("svgContainer", true)
        		.style("pointer-events", "all")
        		.style("fill", "none");
	}

	setAxes(doTraceCenter=true) {
		// Get a range of all possible model axis values
		// We do this by combining all possible values for model x and model y coordinates
		// For the token plot, this range is defined by possible values for a solution
		// this.coordinatesSource is defined in each child class

		this.coordinateColumns = { "x": `${this.coordinatesSource}.x`,
								   "y": `${this.coordinatesSource}.y` };

		console.log(this.coordinateColumns);

		let modelRange = Helpers.getValues(this.dataset, this.coordinateColumns["x"])
								.concat(Helpers.getValues(this.dataset, this.coordinateColumns["y"]));
		
		// The range of possible values for both x and y axis
		let axesRange = this.getRangeFromValues(modelRange);

		// The boundaries of **pixel** values for both axes
		let pixelRange = { "x": [this.dimensions["padding"],
    						 	 this.dimensions["width"] - this.dimensions["padding"]],
    					   "y": [this.dimensions["height"] - this.dimensions["padding"],
    					   		 this.dimensions["padding"]] };

    	// Miniplot ranges are different
    	if (this.level == "aggregate") {
    		pixelRange["x"][1] = this.dimensions["width"];
    		pixelRange["y"][0] = this.dimensions["height"];
    	}

		// Create an axis scaler for both x and y axes
		// can be used by calling this.d3AxisScaler["x"]() or this.d3AxisScaler["y"]()
		this.d3AxisScaler = { "x": d3.scaleLinear()
							 	   .domain(axesRange)
    						 	   .range(pixelRange["x"]),
    					   "y": d3.scaleLinear()
    					   		   .domain(axesRange)
    					   		   .range(pixelRange["y"]) };

    	// If the plot is being updated, we don't need to redraw the axes
    	// The axes will be animated into a new position (see below)
    	if (!doTraceCenter) {
    		return;
    	}

    	// If the plot is new, however, we trace the axes

    	this.x_center = this.traceCenter(this.svg,
    									 this.d3AxisScaler["x"](0),
    									 this.d3AxisScaler["x"](0),
    									 pixelRange["y"][1],
    									 pixelRange["y"][0]);

    	this.y_center = this.traceCenter(this.svg,
    									 pixelRange["x"][0],
    									 pixelRange["x"][1],
    									 this.d3AxisScaler["y"](0),
    									 this.d3AxisScaler["y"](0));
	}

	generatePointCloudCoordinates() {
		// Pre-compute the point cloud coordinates
		// This way, we can save them for later use
		this.pointCloudCoordinates = this.dataset.map(row => this.scaleDataPoint(row));
	}

	generatePointCloud() {
		this.generatePointCloudCoordinates();

		this.pointCloud = this.svg.append("g") // create another SVG group
								   // give it the "dot" class
								  .attr("class", "dot") 
								  .attr("transform", "translate(0, 0)")
								  .selectAll("path")
								  .data(this.dataset)
								  .enter()
								   // create an SVG path for every data point
								  .append("path")
								  .attr("class", "graph")
								   // give the SVG path a scaled transform
								   // this will effectively absolutely position the token
								  .attr("transform",
								   (row, index) => this.generatePointCloudElementTransform(index))
								  .attr("pointIndex", (row, index) => index)
								  ;

		// Set data points style
		this.stylePoints(this.pointCloud)
						.classed("lighter", (row) => { return !this.isPointSelected(row); });

		// Clicks and mouse over
		this.applyEvents(this.pointCloud);

		this.pointCloudElements = this.svg.selectAll(".dot").selectAll("path");
	}

	generatePointCloudElementTransform(index) {
		return `translate(${this.pointCloudCoordinates[index][0]}, ${this.pointCloudCoordinates[index][1]})`;
	}

	updatePointCloud() {
		// Update the axes ("ranges") for the new solution
		this.setAxes(false);

		// From these new axes, generate new coordinates
		this.generatePointCloudCoordinates();

		// Update the coordinates for the existing data points
		this.pointCloudElements.transition()
					   		   .duration(this.animationDuration)
					   		   .attr("transform", (row, index) =>
					   		   		this.generatePointCloudElementTransform(index));

		// Move the axes
		this.x_center.transition()
					 .duration(this.animationDuration)
					 .attr("x1", this.d3AxisScaler["x"](0))
					 .attr("x2", this.d3AxisScaler["x"](0));
		
		this.y_center.transition()
					 .duration(this.animationDuration)
					 .attr("y1", this.d3AxisScaler["y"](0))
					 .attr("y2", this.d3AxisScaler["y"](0));
	}

	applyEvents(points) {
		return points.on("mouseover", (row, index, points) => {
							let pointElement = d3.select(points[index]);
							this.mouseOverPoint(row, pointElement);
						})
					 .on("mouseout", () => { this.mouseOut(); })
					 .on("click", (row, index, points) => { this.onDataPointClick(row, points[index]); });
	}

	stylePoints(points) {
		return points.attr("d", d3.symbol()
								.type((row) => { return this.codePoint(row, this.dataPointStyles["shape"]); } )
								.size((row) => { return this.codePoint(row, this.dataPointStyles["size"]); } )
								)
								.style("fill", (row) => { return this.codePoint(row, this.dataPointStyles["colour"]); } )
								.style("stroke", "grey");
	}

	traceCenter(p, x1, x2, y1, y2) {
		// 🤷‍
		return (
        p.append("line")
            .attr("x1", x1)
            .attr("x2", x2)
            .attr("y1", y1)
            .attr("y2", y2)
            .attr("stroke", "lightgray")
            .attr("stroke-width", 1));
	}

	// We can scale the values to get some form of padding
	getRangeFromValues(values) {
		return [ Math.min(...values) * this.scale, Math.max(...values) * this.scale ];
	}

	scaleDataPoint(row) {
		// We get the x and y coordinates for this data point, and scale them

		// We return the transformed coordinates as some sort of tuple
		// Why? Because we can them encode them separately
		return [ this.d3AxisScaler["x"](row[this.coordinateColumns["x"]]),
				 this.d3AxisScaler["y"](row[this.coordinateColumns["y"]]) ];
	}

	translateDataPoint(row) {
		// We get the x and y coordinates for this data point, and scale them
		return `translate(${this.d3AxisScaler["x"](row[this.coordinateColumns["x"]])}, ${this.d3AxisScaler["y"](row[this.coordinateColumns["y"]])})`
	}

	codePoint(row, dataPointStyle) {
		if (dataPointStyle.variable == null) {
			return dataPointStyle.default_value;
		} else {
			// if not a number (so not size? todo)
			if (isNaN(dataPointStyle.default_value)) {
				return dataPointStyle.schema.domain(dataPointStyle.values)(row[dataPointStyle.variable]);
			}
			// todo: check what the if NAN does here because I don't know
			// also I don't know what any of this means 🤷‍
			return dataPointStyle.schema.domain(d3.extent(dataPointStyle.values))(+row[dataPointStyle.variable]);
		}
	}

	highlightPoint(pointElement, lostToken=false) {
		// We need to append to a different subplot if the token is lost
		let classToSelect = lostToken ? ".lostdot" : ".dot";

		// -- HIGHLIGHT EFFECT --
		this.svg.select(classToSelect)
				.append("path")
				.attr("class", "selector")
				.attr("transform", pointElement.attr("transform"))
				.attr("d", d3.symbol().type(d3.symbolCircle).size(250))
				.style("fill", "none")
				.style("stroke", this.generateComplementaryColour(pointElement.style("fill")))
				.style("stroke-width", 2);
	}

	highlightPointFromPointIndex(itemId) {
		let	lostToken = true;
		let pointElement = this.pointCloud.filter(row => row[this.idColumn] == itemId);

		// It could be that this element is lost. We look in the other dataset in that case
		if (pointElement.empty()) {
			pointElement = this.lostPointCloud.filter(row => row[this.idColumn] == itemId);
		} else {
			lostToken = false;
		}

		this.highlightPoint(pointElement, lostToken);
	}

	showTooltip(row, pointElement) {
		// Reconstruct the coordinates from point index
		let position = this.pointCloudCoordinates[+pointElement.attr("pointIndex")];

		let svgDimensions = { "width": parseFloat(this.svgPlot.style("width")),
							  "height": parseFloat(this.svgPlot.style("height")) };

		// The plot is actually scaled depending on the screen size
		// We compute the actual "real" absolute coordinates
		let realCoordinates = [ svgDimensions["width"] / this.dimensions["width"] * position[0],
								svgDimensions["height"] / this.dimensions["height"] * position[1] ];

		// --- TOOLTIP ---
		let tooltipContent = this.generateTooltipContent(row);
		this.tooltip.show(tooltipContent,
						  realCoordinates[1],
						  realCoordinates[0],
						  svgDimensions["width"]);
	}

	hideTooltip() {
		// Do the fade-out effect
		//this.tooltip.transition().duration(this.tooltipTimeoutDuration).style("opacity", 0);
		// Completely set display to "none" after the set timeout
		//this.tooltipHideTimeout = setTimeout(
		//	() => { this.tooltip.style("display", "none"); }, this.tooltipTimeoutDuration);

		this.tooltip.hide();
	}

	mouseOut() {
		// Remove selector rings
		d3.selectAll(".selector").remove();
	}

	restyle(dataPointStyles) {
		this.dataPointStyles = dataPointStyles;

		// Restyle, maybe the data point styles have changed
		this.stylePoints(this.pointCloud);

		this.drawLegend();
	}

	updateSelection(items) {
		if (typeof items != "undefined") {
			this.selection = items;
		}

		// If something is selected, everything else is translucent
		this.svg.selectAll(".dot")
		  .selectAll("path.graph")
		  // If no models are selected, everything is translucent
		  // Else, only selected models are fully opaque
		  .style("opacity", this.getOpacity())
		  .classed("lighter", (row) => 
		  	{ if (this.selection.count > 0) {
		  	  	return !this.selection.items.includes(row[this.idColumn]);
		  	  } else {
		  	  	return false;
		  	  }
		  	  } );

		this.drawLegend();
	}

	// If we have a bunch of miniplots with opacity, there will be MASSIVE LAG !!!
	// So, for the aggregate level, the opacity is always simply 1
	getOpacity() {
		if (this.level == "aggregate") {
			return 1;
		} else {
			return this.selection.count > 0 ? 1 : 0.7;
		}
	}

	generateComplementaryColour(colour) {
		let hslColour = d3.hsl(colour);
		let hue = hslColour["h"];
		let newHue = +hue < 180 ? +(hue + 180) : +(hue - 180);
		hslColour["h"] = newHue;
		return hslColour.toString();
	}
}