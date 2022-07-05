class Redirect {
	constructor() {
		this.searchParams = new URLSearchParams(window.location.search);

		this.type = null;
		this.model = null;

		if (this.searchParams.has("type")) {
			this.type = this.searchParams.get("type");
		}

		if (this.searchParams.has("model")) {
			this.model = this.searchParams.get("model");
		}
	}

	doRedirect(level) {
		let url = "./";

		if (this.type != null) {
			switch (level) {
				case 1:
					url += router.router.generate("model.type", { type: this.type });
					break;
				case 3:
					url += router.router.generate("token.type.model", { type: this.type,
																		model: this.model });
					break;
			}
		}

		window.location.href = url;
	}
}