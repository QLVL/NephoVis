class ModelContingencyTable {
	constructor(model, contextWord, selectedTokens, nonSelectedTokens) {

		this.model = model;
		this.contextWord = contextWord;
		this.selectedTokens = selectedTokens;
		this.nonSelectedTokens = nonSelectedTokens;

		this.buildTable();
	}

	buildTable() {
		let inModelContexts = this.selectedTokens.map(row => row[this.model]);
		let outModelContexts = this.nonSelectedTokens.map(row => row[this.model]);

		// a
		this.inModelContextWordCount = inModelContexts.flatMap(context => context.split(";"))
									.filter(contextWord => contextWord == this.contextWord)
									.length;
		// b
		this.outModelContextWordCount = outModelContexts.flatMap(context => context.split(";"))
									.filter(contextWord => contextWord == this.contextWord)
									.length;
		// c
		this.inModelContextWordCountDifference = 
			inModelContexts.length - this.inModelContextWordCount;
		// d
		this.outModelContextWordCountDifference =
			outModelContexts.length - this.outModelContextWordCount;

		// n
		this.contextWordsCount = this.inModelContextWordCount +
								 this.outModelContextWordCount +
								 this.inModelContextWordCountDifference +
								 this.outModelContextWordCountDifference;

		Splash.hide();
	}

	countContextWords(needle, haystack) {
		let foundContextWords = haystack.flatMap(row => row[model].split(";"))
										.filter(contextWord == needle);

		return foundContextWords.length;
	}
}