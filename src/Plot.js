class Plot {
	constructor(targetElementName, dimensions, dataset, dataPointStyles, modelSelection) {
		// Save the correct dataset
		this.dataset = dataset;
		this.dataPointStyles = dataPointStyles;
		this.modelSelection = modelSelection;

		// Set plot-wide scale
		// TODO: this should probably be variable
		this.scale = 1.05;

		// Find the svg container element which we will plot to
		this.targetElement = d3.select(`#${targetElementName}`);

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
		this.svg.append("rect")
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
								  .attr("transform", (row) => { return this.translateDataPoint(row); } );

		// Set data points style
		this.pointCloud.attr("d", d3.symbol()
									.type((row) => { return this.codePoint(row, this.dataPointStyles["shape"]); } )
									.size((row) => { return this.codePoint(row, this.dataPointStyles["size"]); } )
									)
									.style("fill", (row) => { return this.codePoint(row, this.dataPointStyles["colour"]); } )
						.classed("lighter", (row) => { return !this.isPointSelected(row); })
						.on("mouseover", () => {}) // todo implement mouseOver
						.on("mouseout", () => {}) // todo implement mouseOut
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
				return dataPointStyle.schema.domain(dataPointStyle.values)([dataPointStyle.variable]);
			}
			// todo: check what the if NAN does here because I don't know
			// also I don't know what any of this means 🤷‍
			return dataPointStyle.schema.domain(d3.extent(dataPointStyle.values))(+row[dataPointStyle.variable]);
		}
	}

	isPointSelected(row) {
		if (this.modelSelection.length > 0)
		{
			return this.modelSelection.includes(row["_model"]);
		}

		return true;
	}
}