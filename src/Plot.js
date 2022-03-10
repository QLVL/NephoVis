class Plot {
	constructor(targetElementName, dimensions, dataset, dataPointStyles, modelSelection) {
		// Save the correct dataset
		this.dataset = dataset;
		this.dataPointStyles = dataPointStyles;
		this.modelSelection = modelSelection;

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
					.classed("svgPlot", true)
					.append("g") // add SVG group
					.call(d3.zoom().on('zoom', this.onZoom));

		// set tooltip and pointer events
		// todo: this is different for level 2
		this.setTooltip(this.targetElement);
		this.setPointerEvents();

		// Initialise the plot axes
		// These are based on the value range and the physical available pixel estate
		this.setAxes();

		// Add the data points to the plot
		this.generatePointCloud();
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
		let modelRange = Helpers.getValues(this.dataset, "model.x")
								.concat(Helpers.getValues(this.dataset, "model.y"));
		
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
		this.pointCloud.attr("d", d3.symbol()
									.type((row) => { return this.codePoint(row, this.dataPointStyles["shape"]); } )
									.size((row) => { return this.codePoint(row, this.dataPointStyles["size"]); } )
									)
									.style("fill", (row) => { return this.codePoint(row, this.dataPointStyles["colour"]); } )
						.classed("lighter", (row) => { return !this.isPointSelected(row); })
						.on("mouseover", (row, index, points) => {  this.mouseOverPoint(row, points[index]); })
						.on("mouseout", () => { this.mouseOut(); }) // todo implement mouseOut
						.on("click", () => {}) // todo iimplement onClick
		  ;
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
		return [ this.d3AxisScaler["x"](row['model.x']),
				 this.d3AxisScaler["y"](row['model.y']) ];
	}

	translateDataPoint(row) {
		// We get the x and y coordinates for this data point, and scale them
		// todo: make this variable for other levels
		return `translate(${this.d3AxisScaler["x"](row['model.x'])}, ${this.d3AxisScaler["y"](row['model.y'])})`
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

	mouseOverPoint(row, pointElement) {
		// Update svg container reference
		this.svgContainer = d3.select(".svgPlot");

		pointElement = d3.select(pointElement);
		// Reconstruct the coordinates from point inderx
		let position = this.pointCloudCoordinates[+pointElement.attr("pointIndex")];

		let svgDimensions = { "width": parseFloat(this.svgContainer.style("width")),
							  "height": parseFloat(this.svgContainer.style("height")) };

		// The plot is actually scaled depending on the screen size
		// We compute the actual "real" absolute coordinates
		let realCoordinates = [ svgDimensions["width"] / this.dimensions["width"] * position[0],
								svgDimensions["height"] / this.dimensions["height"] * position[1] ];

		// --- TOOLTIP ---

		// Clear tooltip hide timeout
		clearTimeout(this.tooltipHideTimeout);

		// Show the tooltip
		this.tooltip.transition()
					.duration(200)
					.style("opacity", 1)
					.style("display", "block");

		// Check for each data point style whether there is a variable attached to it
		// If there is, generate the required tooltip text
		let tooltipData = [];
		for (let dataPointStyleName in this.dataPointStyles) {
			let dataPointStyle = this.dataPointStyles[dataPointStyleName];
			let tooltipRow = dataPointStyle.variable == null ? 
							 "" :
							 `<br><strong>${dataPointStyle.variable}: ${dataPointStyle.format(row[dataPointStyle.variable])}</strong>`;
			tooltipData.push(tooltipRow);
		}
	
		let tooltipContent = `<strong>${row["_model"]}</strong>` + tooltipData.join("");

		// Create the tooltip first (we need its width to position it)
		this.tooltip.html(tooltipContent)
			 	    .style("top", realCoordinates[1] + "px");

		// Determine the tooltip location
		let tooltipLeftCoordinate = position[0];
		let tooltipWidth = parseInt(this.tooltip.style("width"));
		// If there isn't enough room to show the tooltip
		if (svgDimensions["width"] - position[0] < tooltipWidth) {
			// Adjust the tooltip position
			tooltipLeftCoordinate = Math.max(0, (position[0] - tooltipWidth)) + "px";
		}

		// Adjust the left coordinate
		this.tooltip.style("left", tooltipLeftCoordinate);

		// -- HIGHLIGHT EFFECT --
		this.svg.select(".dot")
				.append("path")
				.attr("class", "selector")
				.attr("transform", pointElement.attr("transform"))
				.attr("d", d3.symbol().type(d3.symbolCircle).size(250))
				.style("fill", "none")
				.style("stroke", this.generateComplementaryColour(pointElement.style("fill")))
				.style("stroke-width", 2);

		this.updateSelection();
	}

	mouseOut() {
		// Remove selector rings
		d3.selectAll(".selector").remove()

		// Do the fade-out effect
		this.tooltip.transition().duration(this.tooltipTimeoutDuration).style("opacity", 0);

		// Completely set display to "none" after the set timeout
		this.tooltipHideTimeout = setTimeout(
			() => { this.tooltip.style("display", "none"); }, this.tooltipTimeoutDuration);
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
			  	{ let idColumn = this.level == "model" ? "_model" : "_id";
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