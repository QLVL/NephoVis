class Legend {
	constructor(dataset, level, type, dataPointStyles, padding) {
		// Remove everything already in the legend bar
		d3.select(".legendBar").selectAll("svg").remove();

		this.dataset = dataset;
		this.level = level;
		this.type = type;
		this.dataPointStyles = dataPointStyles;
		this.padding = padding;

		this.buildLegend();
	}

	buildLegend() {
		for (let dataPointStyleName in this.dataPointStyles) {
			let dataPointStyle = this.dataPointStyles[dataPointStyleName];

			// If no styling is applied for this style, go to the next style
			if (dataPointStyle.values == null) {
				continue;
			}

			let legend = dataPointStyle.legend.on("cellclick", () => { }); // todo

			d3.select(dataPointStyle.legendContainer)
			  .append("svg")
			  .style("width", d3.select(".legendBar").style("width"))
              .style("height", (dataPointStyle.values.length * 25 + this.padding) + "px")
              .attr("transform", "translate(0,0)")
              .attr("id", `legend${dataPointStyle.style}`)
              .append("g")
              .attr("class", "legend")
              .attr("transform", "translate(" + 0 + ", " + this.padding / 2 + ")")
              .call(legend);
		}
	}
}