const fs = require('fs');
const url = require('url');
const http = require('http');
const path = require('path');
const config = require('./config');



/**
 * Build the data. Simulated data store.
 */
let counter = 1;

const postsDataStore = [];

function generatePost(id, title, content) {
	return { _id: id, title, content };
}

function addPost(post) {
	postsDataStore.push(post);
}

function getPost(id) {
	return postsDataStore.filter((p) => p._id === id);
}

function buildPosts(number) {
	for (let i = 0; i < number; i++) {
		const post = generatePost(counter, `Post${counter}-title`, `Post${counter}-content`);
		addPost(post);
		counter += 1;
	}
};

buildPosts(3);


/**
 * Create map object that stores the routes and associated callback functions.
 */
const routes = new Map();

// Route for GET /.
routes.set('GET:/', function(req, res) {
	const indexFileURL = path.join(__dirname, config.publicDir, 'index.html');
	
	res.writeHead(200, {
		"Content-Type": "text/html"
	});
	
	fs.readFile(indexFileURL, function(err, data) {
		if (err) throw err;
		res.end(data);
	});
});

// Route for POST /
routes.set('POST:/', function(req, res) {
	res.writeHead(200, {
		"Content-Type": "text/html"
	});
	res.write('<p>Your request\'s body is:</p>');
	res.write('<pre>');
	res.write(req.body ? req.body : 'Empty');
	res.write('</pre>');
	res.write('<p>And the query is:</p>');
	res.write('<pre>');
	res.write(req.query ? JSON.stringify(req.query) : 'Empty');
	res.write('</pre>');
	res.end('<small>Test success!</small>');
});

// Route for GET /posts - returns posts as an array;
routes.set('GET:/posts', function(req, res) {
	res.writeHead(200, {
		"Content-Type": "application/json"
	});

	res.write(JSON.stringify({ posts: postsDataStore }));

	res.end();
});

// Route for POST /posts - returns newly created post.
routes.set('POST:/posts', function(req, res) {
	res.writeHead(200, {
		"Content-Type": "application/json"
	});

	if (!req.body) {
		res.write(JSON.stringify({ message: "Post data not found"}));
		res.end();
	} else {
		const { title, content } = JSON.parse(req.body);
		const post = generatePost(counter, title, content);
		counter += 1;
		addPost(post);
	
		res.write(JSON.stringify({ post }));
	
		res.end();
	}
});



/**
 * Start up the server and allow it to handle requests.
 */

//Parse http requests and maps them to the appropriate response.
function httpRequestHelper(req, res) {
	const method = req.method;
	const urlParsed = url.parse(req.url);
	const query = urlParsed.query;
	let body = '';

	req.on('data', function(data) {
		body += data;
	});

	req.on('end', function () {
		// get the callback associated with the route.
		const callback = routes.get(`${method}:${urlParsed.pathname}`);

		if (method === 'POST') {
			if (query && body) {
				req.query = query;
				req.body = body;
			} else if (body) {
				req.body = body;
			}
		}

		if (callback) {
			callback.call({}, req, res);
		} else {
			// Response if there is no associated route.
			res.writeHead(404, {
				"Content-Type": "application:json"
			});
			res.write(JSON.stringify({
				message: "URL not found",
				method: "req.method",
				url: req.url
			}));
			res.end();
		}
	});
}

// Starting up the server.
const listen = () => { console.log(`Server is listening on port ${config.port}`); }
const server = http.createServer();
server.on('request', httpRequestHelper);
server.listen(config.port, config.host, listen);