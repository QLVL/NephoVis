class Router
{
	constructor()
	{
		this.router = new Navigo("/nephovis/", true);
		this.routes = { "frequency/:type/:contextWordsColumn/:selection": { 
					  				as: "frequency.type.contextwordscolumn.selection",
									uses: (params) => { nephoSession.buildFrequencyTable(params.type,
																				   params.contextWordsColumn,
																				   params.selection); }
									},
					    "cws/:type/:selection": { 
					  				as: "cws.type.selection",
									uses: (params) => { nephoSession.buildContextWordsTable(params.type,
																				   params.selection); }
									},
						"token/:type/:model": { as: "token.type.model",
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
					  	"aggregate/:type/:selection": { as: "aggregate.type.selection",
									uses: (params) => { nephoSession.buildNephoVis("aggregate",
																				   params.type,
																				   params.selection); }
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