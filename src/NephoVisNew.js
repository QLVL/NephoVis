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

		// This could be better but it'll have to make do for now
		this.centralColumn = this.level == "model" ? "_model" : "_id";
	}

	// This method needs to be called separately by level 2 because we need information from
	// the selection before we can initalise all the variables
	// It's really annoying, but it's the only way...
	initVarsSimple() {
		let modelSelectionDataset;

		if (this.level == "model") {
			modelSelectionDataset = this.dataLoader.datasets["models"];
		}
		else {
			modelSelectionDataset = [];
		}

		// TODO: re-introduce LocalStorage if deemed necessary
		this.modelSelection = new ModelSelection(modelSelectionDataset,
												 () => { this.updateSelection(); });
	}

	initVarsContinued() {
		this.dataProcessor = new DataProcessor(this.dataLoader.datasets, this.centralDataset);
		
		this.initVariableSelection();

		// Frequency doesn't need any of this, so begone!!!
		if (this.level == "frequency") {
			return;
		}

		let dataOptionsTable;
		switch (this.level) {
			case "model":
			case "aggregate":
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

	initVars() {
		this.initVarsSimple();
		this.initVarsContinued();
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
		this.updateUrl();
	}

	selectionByLegend(variable, value) {
		// Because my selection behaviour is a bit different than in the original version, this works differently too
		// The idea is that we will only remove a selection if the entire "to select" is selected
		let itemsToSelect = this.dataLoader.datasets[this.centralDataset].filter(
			row => row[variable] == value).map(row => row[this.centralColumn]);
		let allSelected = itemsToSelect.every(tokenId => this.itemSelection.items.includes(tokenId));

		if (!allSelected) {
			itemsToSelect.forEach(item => this.itemSelection.addIfNotIn(item, false));
		} else {
			itemsToSelect.forEach(item => this.itemSelection.remove(item, false));
		}
	}

	// To export
	exportSelection() {
		// Data point style is an object, so it's easiest to just save the necessary values in a dict
		let dataPointStylesSerialised = {};
		for (let dataPointStyleName in this.dataPointStyles) {
			let dataPointStyle = this.dataPointStyles[dataPointStyleName];
			dataPointStylesSerialised[dataPointStyle.style] =
				{ "variable": dataPointStyle.variable,
				  "values": dataPointStyle.values };
		}

		let toExport = { "level": this.level,
						 "type": this.type,
						 "modelSelection": this.modelSelection.models,
						 "variableSelection": this.variableSelection,
						 "dataPointStyles": dataPointStylesSerialised };

		if (this.level == "token") {
			toExport["tokenSelection"] = this.tokenSelection.tokens;
			toExport["chosenSolution"] = this.chosenSolution;
		}

		// Base64 encode our selection
		let json = JSON.stringify(toExport);
		let encodedExport = btoa(json);

		// Compress the string so it (hopefully) fits in the browser URL
		//let compressed = LZString.compress(encodedExport);

		return encodedExport;
	}

	importSelection(simple=false) {
		if (this.selection == null) {
			return null;
		}

		if (this.preventImport) {
			this.preventImport = false;
			return null;
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

		// There's an issue with level 2 where we need the model selection for building the
		// tokens dataset, which we need to initalise variables. I know this isn't elegant,
		// but I don't see any other solution at this point unfortunately :(
		if (simple) {
			return null;
		}

		if (!this.level == "frequency") {
			this.variableSelection = decodedExport["variableSelection"];
	
			for (let dataPointStyleName in decodedExport["dataPointStyles"]) {
				let dataPointStyle = decodedExport["dataPointStyles"][dataPointStyleName];
	
				if (dataPointStyle["variable"] == null) {
					continue;
				}
	
				this.dataPointStyles[dataPointStyleName].assign(dataPointStyle["variable"],
																dataPointStyle["values"]);		
			}
		}

		return decodedExport;
	}

	updateUrl() {
		this.preventImport = true;
	}
}