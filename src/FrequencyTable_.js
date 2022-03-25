class FrequencyTable extends NephoVisLevel3 {
	constructor(type, contextWordsColumn, selection) {
		super("frequency", type, null, selection);

		this.contextWordsColumn = contextWordsColumn;
		this.centralDataset = "ppmi";

		this.popoutWindow = true;
	}

	execute() {
		this.initVars();
		this.importSelection();

		this.buildFrequencyData();
	}

	buildFrequencyData() {
		console.log(this.tokenSelection.tokens);

		// Find the context words for the selected tokens
		let contextWords = this.dataLoader.datasets["variables"].filter(row =>
			this.tokenSelection.tokens.includes(row["_id"]))
			.flatMap(row => row[this.contextWordsColumn].split(";"))
			.filter(id => this.dataLoader.datasets["ppmi"].map(context => context["cw"].includes(id)))

		// I think we cast to a set to remove duplicates?
		let contextWordsUnique = new Set(contextWords);
		// ...and back to an array
		contextWordsUnique = Array.from(contextWordsUnique);

		// Get all non-context word PPMI columns
		let frequencyColumns = this.dataLoader.datasets["ppmi"].columns.filter(columnName => columnName != "cw");

		let dataTableRows = contextWordsUnique.map(uniqueId => {
			// "Left-join"
			let frequencyRowMatch = this.dataLoader.datasets["ppmi"].filter(frequencyRow => 
				frequencyRow["cw"] == uniqueId)[0];

			// I think all ids will already have been split at this point? I'll just copy this.
			let tokenCount = contextWords.filter(id => id.split(";").includes(uniqueId)).length;

			// The template of the row we will add
			let tableRow = { "cw": uniqueId, "tokens": tokenCount };
			// Add the other information
			frequencyColumns.forEach(column => tableRow[column] = d3.format(".3")(frequencyRowMatch[column]));

			return tableRow;
		});

		let dataTableColumns = ["Feature", "Tokens"].concat(frequencyColumns);

		// Create the table
		this.dataTable = d3.select("#cwsFreq")
						   .append("table")

		// Prepare the headings
		this.dataTable.append("thead")
					  .append("tr")
					  .selectAll("th")
					  .data(dataTableColumns)
					  .enter()
					  .append("th")
					  .text(column => column);

		// Create the necessary table row for each entry
		let rows = this.dataTable.append("tbody")
								 .selectAll("tr")
								 .data(dataTableRows)
								 .enter()
								 .append("tr")

		// Fill the rows with data
		rows.selectAll("td")
			.data(row => Object.keys(dataTableRows[0]).map(key => ({ "name": key,
																	"value": row[key] })))
			.enter()
			.append("td")
			.attr("data-th", row => row["name"])
			.text(row => row.value);

		// It breaks my heart that we're going to have to keep jquery included.
		// One's gotta do what they gotta do.
		$("table").DataTable({
			// 'destroy' : true,
			'order': [[1, 'desc']]
		});
	}
}