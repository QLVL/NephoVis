class DataPointStyle {
	constructor(style, candidates) {
		this.style = style;
		this.candidates = candidates;
		this.variable = null;
		this.values = null;
		this.format = input => input;

		// Attach d3 styles
		switch (this.style) {
			case "shape":
				this.schema = d3.scaleOrdinal(d3.symbols);
				this.default_value = d3.symbolWye;
				break;
			case "size":
				// remember to set the domain (current variable) before assigning a value
				// todo: find out what this means
				this.schema = d3.scaleLinear().range([40, 200]);
				this.default_value = 64;
				this.format = input => d3.format(".3r")(+input);
				break;
			case "colour":
				this.schema = d3.scaleOrdinal(Constants.colourPalette);
				this.default_value = "#1f77b4"; // original colour
				break;
		}
	}

	assign(variable, values) {
		this.variable = variable;
		this.values = values;
	}
}