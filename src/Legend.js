class Legend {
	constructor(dataset, level, type, variableSelection, dataPointStyles, padding, selectionByLegend) {
		// Remove everything already in the legend bar
		d3.select(".legendBar").selectAll("svg").remove();

		this.dataset = dataset;
		this.level = level;
		this.type = type;
		this.variableSelection = variableSelection;
		this.dataPointStyles = dataPointStyles;
		this.padding = padding;
		this.selectionByLegend = selectionByLegend;

		this.buildLegend();
	}

	buildLegend() {
		for (let dataPointStyleName in this.dataPointStyles) {
			let dataPointStyle = this.dataPointStyles[dataPointStyleName];

			// If no styling is applied for this style, go to the next style
			if (dataPointStyle.values == null) {
				continue;
			}

			// When this legend cell is clicked, we toggle the selection for all elements
			// which adhere to this legend style
			let legend = dataPointStyle.legend.on("cellclick", (variable) => {
				this.selectionByLegend(dataPointStyle.variable, variable);
			 });

			let legendContainer = d3.select(dataPointStyle.legendContainer)
			  .append("svg")
			  .style("width", d3.select(".legendBar").style("width"))
              .style("height", (dataPointStyle.values.length * 25 + this.padding) + "px")
              .attr("transform", "translate(0,0)")
              .attr("id", `legend${dataPointStyle.style}`)
              .append("g")
              .attr("class", "legend")
              .attr("transform", "translate(" + 0 + ", " + this.padding / 2 + ")")
              .call(legend);

             // Apply bold
             // Yes, there is no other way to do this. You have to manipulate the DOM.
             // I even tried to adjust d3-legend.js, but it's a mess as well
             // This is the cleanest solution I could think of, after having spent three hours
             // on making text bold. Please have mercy.
            legendContainer.selectAll(`.${dataPointStyle.style}label`)
			  			   .classed("selected", (variable) => { 
			  					return this.variableSelection[dataPointStyle.variable].includes(variable);
			 });
		}
	}
}