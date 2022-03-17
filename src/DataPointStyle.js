class DataPointStyle {
	constructor(level, style, candidates) {
		this.level = level;
		this.style = style;
		this.candidates = candidates;
		this.variable = null;
		this.values = null;
		this.format = input => input;

		this.valueFunction = d => d;
		this.textFunction = d => d;

		// Attach d3 styles
		switch (this.style) {
			case "shape":
				this.schema = d3.scaleOrdinal(d3.symbols);
				this.default_value = (this.level == "model" ? d3.symbolWye : d3.symbolCircle);
				this.baseLegend = d3.legendSymbol();
				this.legendContainer = "#shapeLegendContainer";
				break;
			case "size":
				// remember to set the domain (current variable) before assigning a value
				// todo: find out what this means
				this.schema = d3.scaleLinear().range([40, 200]);
				this.default_value = 64;
				this.format = input => d3.format(".3r")(+input);
				this.baseLegend = d3.legendSize()
									.shape("circle")
									.labelOffset(15);
            	this.legendContainer = "#sizeLegendContainer";

            	// Set text and value function for the token level
            	if (this.level == "token") {
            		this.valueFunction = d => d.value;
            		this.textFunction = d => d.key;
            	}
				break;
			case "colour":
				this.schema = d3.scaleOrdinal(Constants.colourPalette);
				this.default_value = "#1f77b4"; // original colour
				this.baseLegend = d3.legendColor()
            						.shape("path", d3.symbol()
                								 	 .type(d3.symbolCircle)
                								 	 .size(50)())
            	this.legendContainer = "#colorLegendContainer";
				break;
		}
	}

	assign(variable, values) {
		this.variable = variable;
		this.values = values;

		this.updateLegendScales();
	}

	clear() {
		this.variable = null;
		this.values = null;
	}

	updateLegendScales() {
		switch (this.style) {
			case "colour":
				// TODO: won't this cause a desync between the point styles and the legend?
				let colourRange = this.values.length <= 8 ? Constants.colourPalette : d3.schemeSet3;

				this.scale = d3.scaleOrdinal()
							   .domain(this.values)
							   .range(colourRange);
				break;
			case "shape":
				// TODO: again, what is this?
				let shapeRange = this.values.map(value => d3.symbol().type(this.schema(value))())

				this.scale = d3.scaleOrdinal()
							   .domain(this.values)
							   .range(shapeRange);
				break;
			case "size":
				// TODO: the same
				this.scale = d3.scaleLinear()
							   .domain(d3.extent(this.values))
							   .range([5, 8])
				break;
		}

		// Pre-build the legend title and legend
		let legendTitle = UserInterface.formatVariableName(this.variable);
		this.legend = this.baseLegend.scale(this.scale)
			  	   					 .title(legendTitle)
			  	   					 .classPrefix(this.style);
		// Size-specific additions
		if (this.style == "size") {
			// TODO: find explanation
			let withSmallNumbers = (this.scale.domain()[1] - this.scale.domain()[0]) / (this.values.length - 1) < 1;

			let cellNo = this.values.length;
			if (this.values.length > 6 || withSmallNumbers) {
				cellNo = 5;
			}

			this.legend.cells(cellNo)
					   .labelFormat(withSmallNumbers ? ".04r" : ".0d");
		}
	}
}