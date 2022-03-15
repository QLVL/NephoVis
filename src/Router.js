class Router
{
	constructor()
	{
		this.router = new Navigo("/nephovis/", true);
		this.routes = { "token/:type/:model": { as: "token.type.model",
									uses: (params) => { nephoSession.buildNephoVis("token",
																				   params.type,
																				   null,
																				   params.model); }
									},
					  "token/:type/:model/:selection": { as: "token.type.model.selection",
									uses: (params) => { nephoSession.buildNephoVis("token",
																				   params.type,
																				   params.selection,
																				   params.model); }
									},
						":level/:type": { as: "level.type",
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