class NephoVisLevel2 extends NephoVisLevel23Common {
	constructor(level, type, selection=null) {
		super(level, type, selection);

		this.centralDataset = "tokens";

		// How many models should be kept from a large selection?
		this.truncateUpperBound = 9;
		this.dimensions = { "width": 250,
							"height": 250,
							"padding": 20 };

		// Plot specifications
		this.columnNo = 3; // TODO: should this be responsive?
	}

	execute() {
		// First, initialise the variables just enough so we can import only the model selection
		this.initVarsSimple();
		this.importSelection(true);

		this.model = this.modelSelection.models;

		// In the common level 2-3 class, execute will create the token dataset
		// This token dataset is based on the model selection, which is why we need to import it
		// before we can start creating the token dataset, which is needed for the variable initalisation
		super.execute();

		// Now, we can continue variable initialisation
		this.initVarsContinued();

		/* No models in model selection */
		if (this.modelSelection.models.length == 0) {
			// TODO: do something at this point
			// but: this shouldn't happen, because level 1 should prevent you from expanding
			console.log("No models in selection.")
		}
		else if (this.modelSelection.models.length > this.truncateUpperBound) {
			// TODO: alerts are really bad UI
			// find some toast library and use that
			//window.alert("You have selected too many models, only the first 9 will be used.");
			this.modelSelection.truncate(this.truncateUpperBound);
		}
	}
}