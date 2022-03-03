class Router
{
	constructor()
	{
		this.router = new Navigo("/nephovis/", true);
		this.routes = { ":level/:type": { as: "level.type",
									uses: (params) => { new NephoVis(params.level, params.type); } 
								  },
					  }
		this.router.on(this.routes);
	}
}

let router = new Router();

router.router.resolve();