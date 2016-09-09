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
// default directory, AKA should files be from / or from /files/
var siteDir = "";

// error page locations
var errorPages = {
	"403.html": "/403.html",
	"404.html": "/404.html"
}

try {
	fs.accessSync("settings.json", fs.F_OK);
	// file is accessible
	var settings = JSON.parse(fs.readFileSync('settings.json'));

	// load dir first
	if (settings.siteDirectory && !/^\/$|^$/.test(settings.siteDirectory)) {
		siteDir = settings.siteDirectory;
		if (!/^\/.+/.test(siteDir))
	    	siteDir = "/" + siteDir;
		if (!/\/$/.test(siteDir))
			siteDir = siteDir.replace(/\/$/, "");
		console.log("Loaded site directory...");
	}
	
	// load valid extensions
	if (settings.validExts) {
		for (var key in settings.validExts) validExtensions[key]=settings.validExts[key];
		console.log("Loaded validExts...");
	}

	// load invalid files
	if (settings.invalidFiles) {
		for (var key in settings.invalidFiles) invalids[key]=settings.invalidFiles[key];
		console.log("Loaded invalidFiles...");
	}

	// hostname and port
	if (settings.port && !(process.argv[3])) {
		port = settings.port;
		console.log("Loaded port...");
	}
	if (settings.hostname && !(process.argv[2])) {
		hostname = settings.hostname.replace(/\$siteDir/, siteDir.replace('/', ''));
		console.log("Loaded hostname...");
	}

	// index
	if (settings.indexFile) {
		index = settings.indexFile;
		if (/^[^\/]/.test(index))
			index = "/" + index;
		console.log("Loaded index...");
	}

	// error pages
	if (settings.errorPages) {
		for (var key in settings.errorPages) errorPages[key]=settings.errorPages[key].replace(/\$siteDir/, siteDir);
		console.log("Loaded error files...");
	}
} catch (err) {
	console.error("Problem reading settings file.");
}

// create the server
http.createServer((request, response) => {

	/* LOOK INTO https://gist.github.com/hectorcorrea/2573391 */

	var filename;
	if (request.url == "" || request.url == "/") filename = index;
	else filename = decodeURI(request.url);

	var ext = path.extname(filename);
	var localPath = __dirname;

	filename = siteDir + filename;

	var isValidExt = validExtensions[ext];
	// determine if the file is valid
	var isInvalid = (invalids.indexOf(filename) > -1) || (invalids.indexOf(filename.replace(/^\//, "")) > -1) || (/server\.js/.test(filename));

	if (isValidExt && !isInvalid) {
		localPath += filename;
		fs.exists(localPath, (exists) => {
			if (exists) {
				console.log(`Serving file: ${filename}`);
				getFile(localPath, response, validExtensions[ext]);
			} else {
				console.error(`${filename} - Error 404`);
				// give them the 404 page
				var error404 = `<!DOCTYPE html><html><head><title>404 - File not Found</title></head><body><h1>Error 404</h1><hr/><h2>File not found: ${filename.replace(siteDir, "")}</h2></body></html>`;
				// respond with this default 404 error page UNLESS 404.html is found
				if (!(/favicon\.ico/.test(filename))) fs.readFile(errorPages["404.html"], (err, contents)=>{
					if(!err) {
						response.setHeader("Content-Type", ".html");
						response.setHeader("Content-Length", contents.replace(/\$fileName/, filename.replace(siteDir, "")).length);
						response.statusCode = 404;
						response.end(contents.replace(/\$fileName/, filename.replace(siteDir, ""));
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
		console.info(`${filename} - Error 403`);
		var error403 = "<!DOCTYPE html><html><head><title>403 - Access Denied</title></head><body><h1>Error 403</h1><hr/><h2>Access denied.</h2></body></html>";
		// respond with this default 403 error page UNLESS 403.html is found
		fs.readFile(errorPages["403.html"], (err, contents)=>{
			if(!err) {
				response.setHeader("Content-Type", ".html");
				response.setHeader("Content-Length", contents.replace(/\$fileName/, filename.replace(siteDir, "")).length);
				response.statusCode = 403;
				response.end(contents.replace(/\$fileName/, filename.replace(siteDir, ""));
			} else {
				console.log(errorPages["403.html"] + " not found, sending default 403.");
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
