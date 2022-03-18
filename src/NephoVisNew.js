class NephoVis {
	constructor(level, type, selection=null) {
		UserInterface.setLevelUI(level);

		this.level = level;
		this.type = type;
		this.requestedFiles = RequestedFilesMapper[level];
		this.selection = selection;

		// Define the data loader and load the CSV files for this type
		this.dataLoader = new DataLoader(this.type, this.requestedFiles);
		this.dataLoader.loadData().then(() => { this.execute(); });

		// Disable importing from selection hash
		this.preventImport = false;
	}

	initVars() {
		let modelSelectionDataset;

		if (this.level == "model") {
			modelSelectionDataset = this.dataLoader.datasets["models"];
		}
		else {
			modelSelectionDataset = [];
		}

		this.dataProcessor = new DataProcessor(this.dataLoader.datasets, this.centralDataset);

		// TODO: re-introduce LocalStorage if deemed necessary
		this.modelSelection = new ModelSelection(modelSelectionDataset,
												 () => { this.updateSelection(); });

		this.initVariableSelection();

		let dataOptionsTable;
		switch (this.level) {
			case "model":
				dataOptionsTable = { "colour": this.dataProcessor.nominalNames,
							 	 	 "shape": this.dataProcessor.nominalNames,
							 	 	 "size": this.dataProcessor.numeralNames };
				break;
			case "token":
				this.initTailoredVars();
				this.initContextWordsColumn();

				dataOptionsTable = { "colour": this.dataProcessor.nominalNames,
							 	 	 "shape": this.dataProcessor.nominalNames.filter((nominal) => {
										return (nominal == "Reset" || 
							Helpers.getValues(this.dataLoader.datasets[this.centralDataset], nominal).length <= 7);
										}),
							 	 	 "size": this.dataProcessor.tailoredNumerals };
				break;
		}

		this.dataPointStyles = {};
		for (var i = 0; i < Constants.dataPointStyles.length; i++)
		{
			// todo: embed this in "Constants" somehow
			let dataPointStyleName = Constants.dataPointStyles[i];
			this.dataPointStyles[dataPointStyleName] = new DataPointStyle(this.level,
														dataPointStyleName,
													    dataOptionsTable[dataPointStyleName]);
		}
	}

	initVariableSelection() {
		this.variableSelection = {};
		for (var i = 0; i < this.dataProcessor.nominalNames.length; i++) {
			let nominal = this.dataProcessor.nominalNames[i];
			this.variableSelection[nominal] = [];
		}
	}

	handleCheckboxChange(property, value, checked) {

		if (checked)
		{
			this.variableSelection[property].push(value);
		} else {
			let toDeleteIndex = this.variableSelection[property].indexOf(value);
			this.variableSelection[property].splice(toDeleteIndex, 1); 
		}

		this.modelSelection.select(this.variableSelection);
		// update plot callback is not necessary here because .select has it as a callback

		// todo: re-implement local storage if deemed necessary
	}

	handleDropdownChange(dataPointStyleName, variable) {
		if (variable == "Reset") {
			this.dataPointStyles[dataPointStyleName].clear();
		}
		else {
			this.dataPointStyles[dataPointStyleName].assign(variable,
							Helpers.getValues(this.dataLoader.datasets[this.centralDataset],
							variable));

			console.log(this.dataPointStyles[dataPointStyleName].variable,
						this.dataPointStyles[dataPointStyleName].values);
		}

		// todo: re-implement local storage if deemed necessary

		// TODO: I don't really understand how the data structure works

		this.plot.restyle(this.dataPointStyles);
	}

	selectionByLegend(variable, value) {
		if (this.variableSelection[variable].includes(value)) {
			let toDeleteIndex = this.variableSelection[variable].indexOf(value);
			this.variableSelection[variable].splice(toDeleteIndex, 1); 
		} else {
			this.variableSelection[variable].push(value);
		}

		this.modelSelection.select(this.variableSelection);
		//this.modelSelection.toggle({});

		// Redraw the plot
		this.updateSelection();
	}

	// To export
	exportSelection() {
		let toExport = { "level": this.level,
						 "type": this.type,
						 "modelSelection": this.modelSelection.models,
						 "variableSelection": this.variableSelection };
		// Base64 encode our selection
		let json = JSON.stringify(toExport);
		let encodedExport = btoa(json);

		// Compress the string so it (hopefully) fits in the browser URL
		//let compressed = LZString.compress(encodedExport);

		return encodedExport;
	}

	importSelection() {
		if (this.selection == null) {
			return;
		}

		if (this.preventImport) {
			this.preventImport = false;
			return;
		}

		let decodedExport = ""
		try {
			decodedExport = JSON.parse(atob(this.selection));
		}
		catch (error) {
			console.log(error);
			return;
		}

		// This selection belongs to another type
		if (this.type != decodedExport["type"]) {
			console.log("Rejecting");
			return;
		}

		this.modelSelection.restore(decodedExport["modelSelection"]);
		this.variableSelection = decodedExport["variableSelection"];
	}

	updateUrl() {
		this.preventImport = true;
		window.location.href = router.router.generate("level.type.selection",
													  { level: this.level,
													  	type: this.type,
													  	selection: this.exportSelection() });
	}
}