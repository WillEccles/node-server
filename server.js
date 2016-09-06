// imports
var http = require("http"),
	url = require("url"),
	path = require("path"),
	fs = require("fs");

// default extentions, overwritten if settings file contains some
var validExtensions = { 
	".html": "text/html",			 
	".js": "application/javascript",  
	".css": "text/css", 
	".txt": "text/plain", 
	".jpg": "image/jpeg", 
	".gif": "image/gif", 
	".png": "image/png",
	".ico": "image/ico",
	".zip": "application/zip"
};

// default invalid files
var invalids = [
	"/server.js",
	"/settings.json",
	"/run.bat",
	"/run.sh"
];

// default IP and port
var hostname = process.argv[2] || "127.0.0.1";
var port = process.argv[3] || 80;
// default to index.html if index is not specified
var index = "index.html";

try {
	fs.accessSync("settings.json", fs.F_OK);
	// file is accessible
	var settings = JSON.parse(fs.readFileSync('settings.json'));
	
	// load valid extensions
	if (settings.validExts) {
		validExtensions = settings.validExts;
		console.log("Loaded validExts...");
	}

	// load invalid files
	if (settings.invalidFiles) {
		invalids = settings.invalidFiles;
		console.log("Loaded invalidFiles...");
	}

	// hostname and port
	if (settings.port && !(process.argv[3])) {
		port = settings.port;
		console.log("Loaded port...");
	}
	if (settings.hostname && !(process.argv[2])) {
		hostname = settings.hostname;
		console.log("Loaded hostname...");
	}

	// index
	if (settings.index) {
		index = settings.index;
		if (/^[^\/]/.test(index))
			index = "/" + index;
		console.log("Loaded index...");
	}
} catch (err) {
	console.error("Settings file not found.");
	// file is RIP
	fs.writeFile('settings.json', "{}", (err) => {
		if (err) throw err;
		console.info("Created settings.json");
	});
}

// create the server
http.createServer((request, response) => {

	/* LOOK INTO https://gist.github.com/hectorcorrea/2573391 */

	var filename;
	if (request.url == "" || request.url == "/") filename = index;
	else filename = decodeURI(request.url);

	var ext = path.extname(filename);
	var localPath = __dirname;

	var isValidExt = validExtensions[ext];
	// determine if the file is valid
	var isInvalid = (invalids.indexOf(filename) > -1) || (invalids.indexOf(filename.replace(/^\//, "")) > -1) || (/server\.js/.test(filename));

	if (isValidExt && !isInvalid) {
		localPath += filename;
		fs.exists(localPath, (exists) => {
			if (exists) {
				console.log(`Serving file: ${filename}`);
				getFile(localPath, response, ext);
			} else {
				console.error(`404 - File not found: ${filename}`);
				// give them the 404 page
				var error404 = `<!DOCTYPE html><html><head><title>404 - File not Found</title></head><body><h1>Error 404</h1><hr/><h2>File not found: ${filename}</h2></body></html>`;
				// respond with this default 404 error page UNLESS 404.html is found
				if (!(/favicon\.ico/.test(filename))) fs.readFile("404.html", (err, contents)=>{
					if(!err) {
						response.setHeader("Content-Type", ".html");
						response.setHeader("Content-Length", contents.length);
						response.statusCode = 404;
						response.end(contents);
					} else {
						console.log("404.html not found, sending default 404.");
						response.setHeader("Content-Type", ".html");
						response.setHeader("Content-Length", error404.length);
						response.statusCode = 404;
						response.end(error404);
					}
				});
			}
		});
	} else if (isInvalid || !isValidExt) {
		console.info(`Client requested ${filename} - Serving 403.`);
		var error403 = "<!DOCTYPE html><html><head><title>403 - Access Denied</title></head><body><h1>Error 403</h1><hr/><h2>Access denied.</h2></body></html>";
		// respond with this default 403 error page UNLESS 403.html is found
		fs.readFile("403.html", (err, contents)=>{
			if(!err) {
				response.setHeader("Content-Type", ".html");
				response.setHeader("Content-Length", contents.length);
				response.statusCode = 403;
				response.end(contents);
			} else {
				console.log("403.html not found, sending default 403.");
				response.setHeader("Content-Type", ".html");
				response.setHeader("Content-Length", error403.length);
				response.statusCode = 403;
				response.end(error403);
			}
		});
	}
}).listen(port, hostname);

function getFile(localPath, res, mimeType) {
	fs.readFile(localPath, function(err, contents) {
		if(!err) {
			res.setHeader("Content-Length", contents.length);
			res.setHeader("Content-Type", mimeType);
			res.statusCode = 200;
			res.end(contents);
		} else {
			res.writeHead(500);
			res.end();
		}
	});
}

console.log(`Static file server running at\n	=> http://${hostname}:${port}/\nCTRL + C to shutdown`);
