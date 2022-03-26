class DistanceMatrix extends NephoVisLevel1 {
	constructor(type, selection) {
		super("distance", type, selection);
		this.centralDataset = "modelsdist";
		this.popoutWindow = true;
	}

	execute() {
		// There is only one dataset anyway, so we can just define this
		this.dataset = this.dataLoader.datasets[this.centralDataset];

		this.initVars();
		this.importSelection();

		this.buildDistanceMatrix();
	}

	buildDistanceMatrix() {
		// These are the models for which we want to know their distances to other models
		this.distances = this.dataset.filter(row => 
			this.modelSelection.models.includes(row["_model"]));

		// The elements to which we will be appending data
		this.targetElement = d3.select("#distMatrix");
		this.distanceTable = this.targetElement.append("table")

		// We want to know for each of our nine models what their distance is to the 
		// nine selected models
		let dataTableRows = this.distances.map((distanceRow, index) => {
			// For each of the nine models, we find the distance to the nine models
			let distanceRowId = distanceRow["_model"];
			return this.distances.map(distanceRowInner => distanceRowInner[distanceRowId]);
		});

		// What is the range of values that our distance matrix describes?
		let valueRange = Math.max(...this.distances.map(distanceRow => 
			Math.max(...d3.values(distanceRow).filter(distanceRow =>
				!isNaN(distanceRow)))));

		// = a function!
		let colourScaler = d3.scaleSequential(d3.interpolateGreens)
							 .domain([0, Math.max(1, valueRange)]);

		// The empty entries are for the padding rows

		// Create table headers
		let tableHeaderRow = this.distanceTable.append("thead")
											   .append("tr");
		// Add empty padding cell
		tableHeaderRow.append("th");

		// I have to add a class, else d3 will re-use the padding cell
		tableHeaderRow.selectAll(".real")
					  .data(this.distances)
					  .enter()
					  .append("th")
					  .text((row, index) => index + 1)
					  .classed("real");


		// Create the necessary table row for each entry
		let rows = this.distanceTable.append('tbody')
						  			 .selectAll("tr")
						  			 .data(dataTableRows)
						  			 .enter()
						  			 .append("tr");

		rows.append("th")
			.text((value, index) => index + 1);

		rows.selectAll("td")
			.data(value => value)
			.enter()
			.append("td")
			.text(value => d3.format('.2f')(value))
			.style("background-color", value => colourScaler(value))
			// Set text colour to black or white depending on how strong the background is
			.style('color', value => {
					// Return the appropriate colour
                    let lightValue = d3.hsl(colourScaler(value))['l'];
                    return lightValue <= 0.5 ? 'white' : 'black';
                    });
	}
}