class NephoVis {
	constructor(level, type) {
		this.level = level;
		this.type = type;
		this.requestedFiles = RequestedFilesMapper[level];

		// Define the data loader and load the CSV files for this type
		this.dataLoader = new DataLoader(this.type, this.requestedFiles);
		this.dataLoader.loadData().then(() => { this.execute(); });
	}

	// This method really deserves a rename, but I'm leaving it in for now for transparency
	execute() {
		// TODO: should this be responsive?
		this.canvasWidth = 600;
		this.canvasHeight = 600;
		this.canvasPadding = 40;

		this.initVars();


		UserInterface.createButtons("focrow", this.dataProcessor.foc, 
									this.dataLoader.datasets["models"], this.variableSelection);

		UserInterface.createButtons("socrow", this.dataProcessor.soc,
									this.dataLoader.datasets["models"], this.variableSelection);
		//this.prepareUI();
	}

	initVars() {
		this.dataProcessor = new DataProcessor(this.dataLoader.datasets);
		// TODO: color var, shapevar, sizevar

		// TODO: re-introduce LocalStorage if deemed necessary
		this.modelSelection = []
		this.variableSelection = {};
		for (var i = 0; i < this.dataProcessor.nominalNames.length; i++) {
			let nominal = this.dataProcessor.nominalNames[i];
			this.variableSelection[nominal] = [];
		}
	}
}