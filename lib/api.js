const express = require('express');
const app     = express();
const server  = require('http').Server(app);

app.use(express.json());


// Ghetto workaround so the different interface processes
// have their respective API servers listening on different
// ports
function getPort() {
	const port_base = config.api.port;

	let port_offset;
	switch (app_intf) {
		case 'can0'   : port_offset = 0; break;
		case 'can1'   : port_offset = 1; break;
		case 'client' : port_offset = 2; break;
		case 'dbus'   : port_offset = 3; break;
		case 'ibus'   : port_offset = 4; break;
		case 'kbus'   : port_offset = 5; break;

		default : port_offset = 7;
	}

	return port_base + port_offset;
}


async function init() {
	log.lib('Initializing');


	app.all(/.*./, (req, res, next) => {
		log.lib('[' + req.method + '] ' + req.originalUrl, { body : req.body });
		next();
	});


	app.get('/config', (req, res) => { res.send(config); });
	app.get('/status', (req, res) => { res.send(status); });

	// Force-run garbage collection
	app.get('/app/gc', (req, res) => {
		if (typeof global.gc !== 'function') {
			res.send({ success : false });
			return;
		}

		global.gc();
		res.send({ success : true });
	});


	// Some of these are shameful

	app.post('/config', async (req, res) => {
		if (req.headers['content-type'] !== 'application/json') {
			res.send({ error : 'invalid content-type' });
			return;
		}

		config = req.body;
		await json.config_write();
		res.send(config);
	});


	app.get('/console', (req, res) => {
		update.config('console.output', !config.console.output);
		res.send(config.console);
	});

	const apiPort = getPort();


	log.lib('Initialized');

	await new Promise(resolve => server.listen(apiPort, resolve));

	log.lib('Express listening on port ' + apiPort);
} // async init()

async function term() {
	log.lib('Terminating');

	await server.close();

	log.lib('Terminated');
} // async term()


module.exports = {
	init,
	term,
};
