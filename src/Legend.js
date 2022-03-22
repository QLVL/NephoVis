class Legend {
	constructor(dataset, level, type, itemSelection, idColumn, dataPointStyles, padding, selectionByLegend) {
		// Remove everything already in the legend bar
		d3.select(".legendBar").selectAll("svg").remove();

		this.dataset = dataset;
		this.level = level;
		this.type = type;
		this.itemSelection = itemSelection;
		this.idColumn = idColumn;
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

			let legend = dataPointStyle.legend;

			// When this legend cell is clicked, we toggle the selection for all elements
			// which adhere to this legend style
			
			// Size is a continuous variable, for which clicking doesn't make sense
			// We disable clicking for size
			if (dataPointStyle.style != "size")
			{
				legend = legend.on("cellclick", (variable) => {
					this.selectionByLegend(dataPointStyle.variable, variable);
				 });
			}

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

			  	// I wish this were neater, but it must be like this...
			  	// First, check out which items adhere to this variable
				let filteredItemIds = this.dataset.filter(row => row[dataPointStyle.variable] == variable)
			  	 			   					  .map(row => row[this.idColumn]);

			  	// If there are no items, return false, else check whether all items are in the current selection
			  	return filteredItemIds.length > 0 ?
			  		   filteredItemIds.every(itemId => this.itemSelection.items.includes(itemId)) :
			  		   false;
			  	});
		}
	}
}