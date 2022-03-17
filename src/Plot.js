class Plot {
	constructor(level, targetElementName, dimensions, dataset, dataPointStyles,
				modelSelection, variableSelection, onDataPointClick, selectionByLegend) {
		this.level = level;

		// Save the correct dataset
		this.dataset = dataset;
		this.dataPointStyles = dataPointStyles;
		this.modelSelection = modelSelection;
		this.variableSelection = variableSelection;
		this.onDataPointClick = onDataPointClick;
		this.selectionByLegend = selectionByLegend;

		// Set plot-wide scale
		// TODO: this should probably be variable
		this.scale = 1.05;

		// Time-out for the tooltip
		this.tooltipTimeoutDuration = 200;

		// Find the svg element which we will plot to
		this.targetElement = d3.select(`#${targetElementName}`);
		// Clear target element contents
		this.targetElement.html("");

		// Save the dimensions
		this.dimensions = dimensions;

		// Create a new SVG element
		this.svg = this.targetElement.append("svg")
					.attr("viewBox", `0 0 ${this.dimensions["height"]} ${this.dimensions["width"]}`) // set w & h
					.attr("preserveAspectRatio", "xMinYMin meet")
					.classed("svgPlot", this.level == "model")
					.append("g") // add SVG group
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

		this.legend = new Legend(this.dataset, this.level, this.type, this.variableSelection,
								 this.dataPointStyles, this.dimensions["padding"], this.selectionByLegend);
	}

	onZoom(idk) {
		// todo implement zooming
	}

	setTooltip(targetElement) {
		this.tooltip = targetElement.append("div").attr("class", "tooltip"); 	
	}

	setPointerEvents() {
		this.svgContainer = this.svg.append("rect")
        		.attr("viewBox", `0 0 ${this.dimensions["height"]} ${this.dimensions["width"]}`)
        		.classed("svgPlot", true)
        		.style("pointer-events", "all")
        		.style("fill", "none");
	}

	setAxes() {
		// Get a range of all possible model axis values
		// We do this by combining all possible values for model x and model y coordinates
		// For the token plot, this range is defined by possible values for a solution
		// this.coordinatesSource is defined in each child class

		this.coordinateColumns = { "x": `${this.coordinatesSource}.x`,
								   "y": `${this.coordinatesSource}.y` };

		let modelRange = Helpers.getValues(this.dataset, this.coordinateColumns["x"])
								.concat(Helpers.getValues(this.dataset, this.coordinateColumns["y"]));
		
		// The range of possible values for both x and y axis
		let axesRange = this.getRangeFromValues(modelRange);

		// The boundaries of **pixel** values for both axes
		let pixelRange = { "x": [this.dimensions["padding"],
    						 	 this.dimensions["width"] - this.dimensions["padding"]],
    					   "y": [this.dimensions["height"] - this.dimensions["padding"],
    					   		 this.dimensions["padding"]] };

		// Create an axis scaler for both x and y axes
		// can be used by calling this.d3AxisScaler["x"]() or this.d3AxisScaler["y"]()
		this.d3AxisScaler = { "x": d3.scaleLinear()
							 	   .domain(axesRange)
    						 	   .range(pixelRange["x"]),
    					   "y": d3.scaleLinear()
    					   		   .domain(axesRange)
    					   		   .range(pixelRange["y"]) };

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

	generatePointCloud() {
		// Pre-compute the point cloud coordinates
		// This way, we can save them for later use
		this.pointCloudCoordinates = this.dataset.map((row) => { return this.scaleDataPoint(row); });

		this.pointCloud = this.svg.append("g") // create another SVG group
								   // give it the "dot" class
								  .attr("class", "dot") 
								  .selectAll("path")
								  .data(this.dataset)
								  .enter()
								   // create an SVG path for every data point
								  .append("path")
								  .attr("class", "graph")
								   // give the SVG path a scaled transform
								   // this will effectively absolutely position the token
								  .attr("transform",
								   (row, index) => 
								   `translate(${this.pointCloudCoordinates[index][0]}, ${this.pointCloudCoordinates[index][1]})`)
								  .attr("pointIndex", (row, index) => index)
								  ;

		// Set data points style
		this.stylePoints(this.pointCloud)
						.classed("lighter", (row) => { return !this.isPointSelected(row); });

		// Clicks and mouse over
		this.pointCloud.on("mouseover", (row, index, points) => {
							let pointElement = d3.select(points[index]);
							this.mouseOverPoint(row, pointElement);
						})
						.on("mouseout", () => { this.mouseOut(); }) // todo implement mouseOut
						.on("click", (row, index, points) => { this.onDataPointClick(row, points[index]); });
	}

	stylePoints(points) {
		return points.attr("d", d3.symbol()
								.type((row) => { return this.codePoint(row, this.dataPointStyles["shape"]); } )
								.size((row) => { return this.codePoint(row, this.dataPointStyles["size"]); } )
								)
								.style("fill", (row) => { return this.codePoint(row, this.dataPointStyles["colour"]); } );
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
		// todo: make this variable for other levels

		// We return the transformed coordinates as some sort of tuple
		// Why? Because we can them encode them separately
		return [ this.d3AxisScaler["x"](row[this.coordinateColumns["x"]]),
				 this.d3AxisScaler["y"](row[this.coordinateColumns["y"]]) ];
	}

	translateDataPoint(row) {
		// We get the x and y coordinates for this data point, and scale them
		// todo: make this variable for other levels
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

	isPointSelected(row) {
		if (this.modelSelection.models.length > 0)
		{
			return this.modelSelection.models.includes(row["_model"]);
		}

		return true;
	}

	highlightPoint(pointElement) {
		// -- HIGHLIGHT EFFECT --
		this.svg.select(".dot")
				.append("path")
				.attr("class", "selector")
				.attr("transform", pointElement.attr("transform"))
				.attr("d", d3.symbol().type(d3.symbolCircle).size(250))
				.style("fill", "none")
				.style("stroke", this.generateComplementaryColour(pointElement.style("fill")))
				.style("stroke-width", 2);
	}

	mouseOut() {
		// Remove selector rings
		d3.selectAll(".selector").remove()

		switch (this.level) {
			case "model":
				// Do the fade-out effect
				this.tooltip.transition().duration(this.tooltipTimeoutDuration).style("opacity", 0);

				// Completely set display to "none" after the set timeout
				this.tooltipHideTimeout = setTimeout(
				() => { this.tooltip.style("display", "none"); }, this.tooltipTimeoutDuration);
				break;
		}
	}

	updateSelection() {
		// Todo: check how something of "undefined" can end up here
		// I'll just mirror its functionality for now
		if (this.modelSelection.count > 0 && this.modelSelection.models.includes("undefined")) {
			this.modelSelection = this.modelSelection.filter((model) => { model != "undefined" });
		}

		for (let dataPointStyleName in this.dataPointStyles) {
			// todo: implement "boldenLegend"

			// If something is selected, everything else is translucent
			d3.selectAll(".dot")
			  .selectAll("path.graph")
			  // If no models are selected, everything is translucent
			  // Else, only selected models are fully opaque
			  .style("opacity", this.modelSelection.count > 0 ? 1 : 0.7)
			  .classed("lighter", (row) => 
			  	{ let idColumn = (this.level == "model" ? "_model" : "_id");
			  	  if (this.modelSelection.count > 0) {
			  	  	return !this.modelSelection.models.includes(row[idColumn]);
			  	  } else {
			  	  	return false;
			  	  }
			  	  } );
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