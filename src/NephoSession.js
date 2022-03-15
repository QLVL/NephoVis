class NephoSession {
	constructor() {
		this.nephoVis = null;
	}

	buildNephoVis(level, type, selection, model=null) {
		// If there is an existing NephoVis interface, we maybe can reuse it
		if (this.nephoVis != null) {
			// If the type and level haven't changed, update the selection
			if (this.nephoVis.type == type && this.nephoVis.level == level) {
				this.nephoVis.importSelection(selection);
				return;
			}
			else {
				window.location.reload();
			}
		}

		// In all other cases, build a new nephovis
		switch (level) {
			case "model":
				this.nephoVis = new NephoVisLevel1(level, type, selection);
				break;
			case "token":
				this.nephoVis = new NephoVisLevel3(level, type, model, selection);
				break;
		}
		
	}
}

nephoSession = new NephoSession();