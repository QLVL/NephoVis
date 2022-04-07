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
		let tooltipContent = `<strong>${row["_id"]}</strong>`;

		if (this.contextWordsColumn == null) {
			let tokenCount = this.countTokens(row["_id"]);
			tooltipContent = tooltipContent + `<br>(${tokenCount} tokens)`;
		}

		return tooltipContent;
	}
}