class Router
{
	constructor()
	{
		this.router = new Navigo("/nephovis/", true);
		this.routes = { ":level": { as: "level",
									uses: (params) => { new NephoVis(params.level); } 
								  },
					  }
		this.router.on(this.routes);
	}
}

let router = new Router();

router.router.resolve();