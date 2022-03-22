class FrequencyTable extends NephoVisLevel3 {
	constructor(type, contextWordsColumn, selection) {
		super("frequency", type, null, selection);

		this.contextWordsColumn = contextWordsColumn;
		this.centralDataset = "ppmi";
	}

	execute() {
		this.initVars();
		this.importSelection();

		console.log(this.tokenSelection);
	}
}