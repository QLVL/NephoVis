class Router
{
	constructor()
	{
		this.router = new Navigo("/nephovis/", true);
		this.routes = { ":level/:type": { as: "level.type",
									uses: (params) => { nephoSession.buildNephoVis(params.level,
																				   params.type,
																				   null); } 
								  },
						":level/:type/:selection": { as: "level.type.selection",
									uses: (params) => {
										nephoSession.buildNephoVis(params.level,
																   params.type,
																   params.selection);
									} }
					  }
		this.router.on(this.routes);
	}
}

let router = new Router();

router.router.resolve();