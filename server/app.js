const express = require('express')
const http = require('http');
const fs = require('fs');
// Temporary for faking Bridge

class FeatureServer {
	
	constructor() {
        this.start_server({
			name: "insecure_server",
			port: 3050,
			set_routes: this.set_insecure_routes.bind(this),
		});
	}

	start_server(server_opts) {
		var app = express();
		app.use(express.json());
		app.set('port', server_opts.port);
		server_opts.set_routes(app);


        this.server = http.createServer(app);
		this.server.on('error', (e)=> {console.error(e)});
		this.server.listen(server_opts.port, ()=>{console.log("The server is running! Happy Spelling!")});
	}

	set_insecure_routes(app) {
        app.get('/', (req, res) => {
            res.send('Hello World!');
        })
	}
}


const server = new FeatureServer();

