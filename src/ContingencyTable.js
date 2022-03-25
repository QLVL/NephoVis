class ContingencyTable {
	constructor(contextWord, selectedTokens, nonSelectedTokens, contextWordColumns) {
		this.contextWord = contextWord;
		this.selectedTokens = selectedTokens;
		this.nonSelectedTokens = nonSelectedTokens;
		this.contextWordColumns = contextWordColumns;

		this.buildTable();
	}

	buildTable() {
		this.selectedTokensContextWordCount = // a
			this.countTokens(this.contextWord, this.selectedTokens);
		this.nonSelectedTokensContextWordCount = // b
			this.countTokens(this.contextWord, this.nonSelectedTokens);

		this.selectedTokensCountDifference = // c
			this.selectedTokens.length - this.selectedTokensContextWordCount;
		this.nonSelectedTokensCountDifference = // d
			this.nonSelectedTokens.length - this.nonSelectedTokensContextWordCount;

		// n
		this.tokensCount = this.selectedTokens.length + this.nonSelectedTokens.length;
	}

	countTokens(needle, haystack) {
		let foundTokens = [];
		this.contextWordColumns.forEach(contextWordColumn => {
			let tokenIds = haystack.filter(row =>
				row[contextWordColumn].split(";").includes(needle))
							.map(row => row["_id"]);
			foundTokens = foundTokens.concat(tokenIds);
		});

		return Helpers.unique(foundTokens).length;
	}
}