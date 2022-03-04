class Helpers {
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
}