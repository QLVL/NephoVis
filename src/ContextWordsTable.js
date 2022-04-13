class ContextWordsTable extends NephoVisLevel3 {
	constructor(type, selection) {
		super("cws", type, null, selection);

		this.centralDataset = "variables";

		this.popoutWindow = true;
	}

	execute() {
		this.initVars();
		this.importSelection();

		// Set token count information
		UserInterface.setTokenCount(this.tokenSelection.count);

		this.buildCwsTokenDataset();
		this.buildFrequencyData();

		this.drawTable(Constants.cwsInfoOptions[0]);
	}

	buildCwsTokenDataset() {
		this.dataLoader.datasets["selectedTokens"] =
			this.dataLoader.datasets["variables"].filter(row => 
				this.tokenSelection.tokens.includes(row["_id"]));

		this.dataLoader.datasets["nonSelectedTokens"] =
			this.dataLoader.datasets["variables"].filter(row => 
				!this.tokenSelection.tokens.includes(row["_id"]));
	}

	buildFrequencyData() {
		this.contextWordColumns = this.modelSelection.models.map(model =>
			Helpers.findContextWordsColumn(this.dataProcessor.datasets["variables"].columns,
										   model));

		UserInterface.buildDropdown("info",
									Constants.cwsInfoOptions,
									(value) => { this.drawTable(value); },
									option => option.name,
									option => option.value);

		// For each model, find context words
		// The context words are returned in one FLAT list
		let contextWords = this.contextWordColumns.flatMap(contextWordColumn => 
			this.dataLoader.datasets["selectedTokens"].flatMap(tokenRow => 
				tokenRow[contextWordColumn].split(";")))
					.filter(contextWord => contextWord != "NA");

		this.frequencyColumns = this.modelSelection.models.map((model, index) => index + 1);
		//this.frequencyColumns = this.modelSelection.models.map((model, index) => index + 1);

		this.contextWordFrequencies = Helpers.unique(contextWords).map(contextWord =>
				new FrequencyFunctions(contextWord,
									   this.frequencyColumns,
									   this.contextWordColumns,
									   this.dataLoader.datasets["selectedTokens"],
									   this.dataLoader.datasets["nonSelectedTokens"]).output
			);
	}

	getColumns(suffix) {
		let columns = [ "Feature" ];

		if (suffix == "raw") {
			columns.push("total");
			columns = columns.concat(this.frequencyColumns);
		} else {
			columns.push("total+");
			columns.push(`total${suffix}`);

			this.frequencyColumns.forEach(frequencyColumnIndex => {
				columns.push(`${frequencyColumnIndex}+`);
				columns.push(`${frequencyColumnIndex}${suffix}`);
			});
		}

		return columns;
	}

	drawTable(infoOptions) {
		this.tableData = this.contextWordFrequencies.map(data => data[infoOptions.value]);

		console.log(this.tableData);

		this.columns = this.getColumns(infoOptions["suffix"]);

		console.log(this.columns);

		d3.select("#report")
          .text(`Frequency table with ${infoOptions["name"]}`)
        d3.select("#cwsFreq").selectAll("div").remove();
        d3.select("#cwsFreq").selectAll("table").remove();
        
        this.table = d3.select("#cwsFreq")
        			   .append("table")
        			   .attr("class", "hover");
        
        this.table.append('thead')
        		  .append('tr')
            	  .selectAll('th')
            	  .data(this.columns)
            	  .enter()
            	  .append("th")
           		  .text(d => d);
    
        this.rows = this.table.append('tbody')
         					  .selectAll('tr')
            				  .data(this.tableData)
            				  .enter()
            				  .append('tr');        
        
        this.rows.selectAll('td')
            	 .data(tableDataRow => this.columns.map(column => 
            	 						({ 'name': column, 'value': tableDataRow[column] })))
                 .enter()
        		 .append('td')
        		 .attr("class",  d => typeof d.name === "string" && 
        		 				(d.name.endsWith("+") | d.name.endsWith("A")) ? 
        		 				 "plus" : 
        		 				 "minus")
        		 .attr('data-th', tableDataRow => tableDataRow.name)
        		 .text(tableDataRow => tableDataRow.value);

        $("table").DataTable({
            'destroy' : true,
            "order": [[1, "desc"]]
            // "columnDefs": [{ "visible": false, "targets": 1 }]
        });
	}
}