class Helpers {
	static unique(array) {
		return Array.from(new Set(array));
	}

	static uniqueValues(array, columnName) {
		return [...new Set( array.map(obj => obj[columnName])) ];
	}

	static getValues(array, columnName) {
		let values = Helpers.uniqueValues(array, columnName);
		let isNumeric = values.every(value => !isNaN(value));

		if (isNumeric) {
			return values.map((value) => +value ).sort();
		} else {
			return values.map((value) => value.toString() ).sort();
		}
	}

	// https://stackoverflow.com/a/51874332
	static intersection(data) {
		return data.reduce((a, b) => a.filter(c => b.includes(c)));
	}

	// https://stackoverflow.com/a/42429255
	static mergeVariables(coordinates, variables) {
		let m = new Map();
		// Insert all entries keyed by ID into the Map, filling in placeholder
		// properties since the original coordinates objects don't contain these:
		coordinates.forEach((coordRow) => { 
			for (let key in variables[0]) {
				// Don't overwrite the _id
				if (key == "_id") continue;
				coordRow[key] = Constants.naString; // set "NA" as default value
			}
			m.set(coordRow["_id"], coordRow);
		});

		// For values in 'variables', insert them if missing, otherwise, update existing values:
		variables.forEach((varRow) => {
    		let existing = m.get(varRow._id);
    		if (existing === undefined) {
        		m.set(varRow._, varRow);
        	} else {
        		Object.assign(existing, varRow);
        	}
		});

		// Extract resulting combined objects from the Map as an Array
		return Array.from(m.values());
	}

	// Distinguishes lost and non-list tokens
	static exists(row, coordinateColumns) {
		// This is voodoo magic, don't ask me!
		return (d3.format(".3r")(row[coordinateColumns["x"]]) !== "0.00" || 
				d3.format(".3r")(row[coordinateColumns["y"]]) !== "0.00");
	}

	static existsFromColumn(row, column) {
		let coordinateColumns = { "x": `${column}.x`,
								  "y": `${column}.y` };
								  
		return Helpers.exists(row, coordinateColumns);
	}

	static findContextWordsColumn(dataset, model, prefix="_cws") {
		let contextWordsColumns = dataset.filter(columnName => {
			return (columnName.startsWith(prefix) && model.includes(columnName.slice(prefix.length + 1)));
		});

		return contextWordsColumns.length > 0 ?
			   contextWordsColumns[0] :
			   null;
	}
}