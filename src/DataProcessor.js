class DataProcessor {
	constructor(datasets, centralDataset) {
		this.datasets = datasets;
		this.centralDataset = centralDataset;

		this.extractColumnNames();
		this.extractOrderFeatures();
	}

	extractColumnNames() {
		// We infer the column names from the keys of first entry of the "models" data point
		this.columnNames = Object.keys(this.datasets[this.centralDataset][0]);

		// Now, we need to filter the following columns:
		// 1: columns ending with .x (these are model x coordinates)
		// 2: columns ending with .y (these are model y coordinates)
		// 3: columns which have no unique values
		this.variableNames = this.columnNames.filter((columnName) => {
			return (!([ ".x", ".y" ].includes(columnName.slice(-2))) // 1 and 2 
					&& Helpers.uniqueValues(this.datasets[this.centralDataset], columnName).length > 1 // 3
				);
		});

		// Now, we need to filter the following columns:
		// 1: columns starting with _ (these are model names)
		// 2: models with NaN values
		this.nominalNames = this.variableNames.filter((columnName) => {
			return (!columnName.startsWith("_") // 1
            	&& !Helpers.uniqueValues(this.datasets[this.centralDataset], columnName).every(value => 
            			{ return (!isNaN(value)); })); //2
		});

		console.log(this.nominalNames);

		// Second pass: filter more columns
		// filter all columns with more than 10 unique values
		this.nominalNames = this.nominalNames.filter((columnName) => { 
			return Helpers.uniqueValues(this.datasets[this.centralDataset], columnName).length <= 10 });
		this.nominalNames.push("Reset"); // I don't know why this needs to be in

		this.numeralNames = this.variableNames.filter((columnName) => {
			return Helpers.uniqueValues(this.datasets[this.centralDataset], columnName).filter(value => value != Constants.naString)
																					   .every(value => !isNaN(value));
		});
		this.numeralNames.push("Reset") // I don't know why this needs to be in

		this.contexts = this.columnNames.filter(columnName => columnName.startsWith("_ctxt"));
	
		console.log(this.columnNames, this.variableNames, this.nominalNames, this.numeralNames, this.contexts);
	}

	extractOrderFeatures() {
		// First order columns
		this.foc = this.nominalNames.filter(columnName => columnName.startsWith("foc_"));
		// Second order columns 
		this.soc = this.nominalNames.filter(columnName => columnName.startsWith("soc_"));
	}
}