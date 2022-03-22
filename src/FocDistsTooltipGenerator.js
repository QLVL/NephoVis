class FocDistsTooltipGenerator {
	constructor(dataset, contextWordsColumn) {
		this.dataset = dataset;
		this.contextWordsColumn = contextWordsColumn;
	}

	// For lost token tooltip
	countTokens(needle) {
		return this.dataset.filter(row =>
			row[this.contextWordsColumn].split(";").includes(needle)).length;
	}

	generate(row) {
		let tokenCount = this.countTokens(row["_id"]);
		let tooltipContent = `<strong>${row["_id"]}</strong><br>(${tokenCount} tokens)`;

		return tooltipContent;
	}
}