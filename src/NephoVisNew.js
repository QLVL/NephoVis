class NephoVis {
	constructor(level, type, selection=null) {
		console.log("building a new one", level, type);

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

	// This method really deserves a rename, but I'm leaving it in for now for transparency
	execute() {
		// TODO: should this be responsive?
		this.canvasWidth = 600;
		this.canvasHeight = 600;
		this.canvasPadding = 40;

		this.initVars();

		if (this.selection != null) {
			this.importSelection(this.selection);
		}

		UserInterface.setButton("clearSelect", () => 
			{
				this.modelSelection.clear();
				UserInterface.resetSelectionButtons();
			});

		UserInterface.setButton("medoidsSelect", () =>
			{
				let selectedModels = this.dataLoader.datasets["medoids"].map((row) => row.medoid);

				this.initVariableSelection();
				this.modelSelection.fromMedoids(selectedModels);
				UserInterface.resetSelectionButtons();
			});

		UserInterface.createButtons("focrow", this.dataProcessor.foc, 
									this.dataLoader.datasets["models"], this.variableSelection, 
									(property, value, checked) => 
										{ this.handleCheckboxChange(property, value, checked); });

		UserInterface.createButtons("socrow", this.dataProcessor.soc,
									this.dataLoader.datasets["models"], this.variableSelection,
									(property, value, checked) => 
										{ this.handleCheckboxChange(property, value, checked); });

		for (let dataPointStyleName in this.dataPointStyles)
		{
			let dataPointStyle = this.dataPointStyles[dataPointStyleName];
			UserInterface.buildDropdown(dataPointStyleName, dataPointStyle.candidates, "model", 
										(variable) => 
										{ this.handleDropdownChange(dataPointStyleName, variable); });
		}
		
		this.drawPlot();
	}

	initVars() {
		this.dataProcessor = new DataProcessor(this.dataLoader.datasets);

		// TODO: re-introduce LocalStorage if deemed necessary
		this.modelSelection = new ModelSelection(this.dataLoader.datasets["models"],
												 () => { this.drawPlot(); });

		this.initVariableSelection();

		let dataOptionsTable = { "colour": this.dataProcessor.nominalNames,
							 	 "shape": this.dataProcessor.nominalNames,
							 	 "size": this.dataProcessor.numeralNames };

		this.dataPointStyles = {};
		for (var i = 0; i < Constants.dataPointStyles.length; i++)
		{
			// todo: embed this in "Constants" somehow
			let dataPointStyleName = Constants.dataPointStyles[i];
			this.dataPointStyles[dataPointStyleName] = new DataPointStyle(dataPointStyleName,
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

	drawPlot() {
		// If the plot has to redraw, surely some other update has happened
		// So, we update the UI as well
		UserInterface.prepareUI(this.level, this.type, this.modelSelection.count);

		let mouseClickFunction = this.mouseClickPoint.bind(this);

		this.preventImport = true;
		window.location.href = router.router.generate("level.type.selection",
													  { level: this.level,
													  	type: this.type,
													  	selection: this.exportSelection() });

		this.plot = new Plot(this.level,
							 "svgContainer",
							 { "width": 600, "height": 600, "padding": 40 },
							 this.dataLoader.datasets["models"],
							 this.dataPointStyles,
							 this.modelSelection,
							 mouseClickFunction);
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

		// todo: re-implement local storage if deemed necessary
	}

	handleDropdownChange(dataPointStyleName, variable) {
		if (variable == "Reset") {
			this.dataPointStyles[dataPointStyleName].clear();
		}
		else {
			this.dataPointStyles[dataPointStyleName].assign(variable,
												 			Helpers.getValues(this.dataLoader.datasets["models"],
																  	 		  variable));
		}

		// todo: re-implement local storage if deemed necessary

		// TODO: I don't really understand how the data structure works

		this.drawPlot();

		// TODO updateLegend
	}

	mouseClickPoint(row, pointElement) {
		// We manually add a model to the model selection
		// Or, if it's already in the model selection, we remove it
		if (!this.modelSelection.models.includes(row["_model"])) {
			this.modelSelection.add(row["_model"]);
		} else {
			this.modelSelection.remove(row["_model"]);
		}

		// Redraw the plot
		this.drawPlot();
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

	importSelection(encodedExport) {
		if (this.preventImport) {
			this.preventImport = false;
			return;
		}

		let decodedExport = ""
		try {
			decodedExport = JSON.parse(atob(encodedExport));
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
}