// TODO: Add "teapot" setting for a page which returns a 418 "I'm a teapot" status and shows the specified page

// imports
var http = require("http"),
	https = require("https"),
	url = require("url"),
	path = require("path"),
	fs = require("fs"),
	stdin = process.stdin,
	crypto = require('crypto');

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
	"/run.sh",
	"/users.json"
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

// https or http?
var useHTTPS = false;

// use authentication?
var useAuth = false;

// options for https if needed
var SSLOptions = {
};

// users if using HTTPS
var users = {
};

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

	// https
	if (settings.useHTTPS) {
		useHTTPS = settings.useHTTPS;
		console.log("Using HTTPS...");
		// if HTTPS is enabled, use auth?
		if (settings.requiresAuth) {
			useAuth = settings.requiresAuth;
			console.log("Requiring authenticaiton...");
			try {
				fs.accessSync("users.json", fs.F_OK);
				console.log("Loading users...");
				var usersFile = JSON.parse(fs.readFileSync("users.json"));
				for (var key in usersFile)
					users[key] = usersFile[key]; 
			} catch(err) {
				console.error("Error loading users. Disabling auth.");
				console.error(err);
				process.exit(1);
				useAuth = false;
			}
		}
	}

	// https cert/key
	if (useHTTPS && settings.sslOptions["key"] && settings.sslOptions["cert"]) {
		try {
			fs.accessSync(settings.sslOptions["key"], fs.F_OK);
			console.log("Reading key file...");
			SSLOptions.key = fs.readFileSync(settings.sslOptions["key"]);
		} catch (err) {
			console.error("Problem reading key file.");
			useHTTPS = false;
			console.error(err);
		}
		try {
			fs.accessSync(settings.sslOptions["cert"], fs.F_OK);
			console.log("Reading cert file...");
			SSLOptions.cert = fs.readFileSync(settings.sslOptions["cert"]);
		} catch(err) {
			console.error("Problem reading cert file.");
			useHTTPS = false;
			console.error(err);
		}
		if (!useHTTPS)
			console.log("Disabling HTTPS...");
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

// handle input from stdin while process is running
stdin.resume();
stdin.on('data', (chunk) => {
	// handle commands here
	var line = chunk.toString().replace(/\n/, '');
	
	// command cases:
	if (/^adduser [^\s\t]+ [^\s\t]+$/i.test(line)) {
		// add a user to the list of users
		var parts = line.split(' ');
		var username = parts[1];
		var pass = parts[2];
		if (users[username])
			console.error(`Error:\n    User '${username}' already exists.`);
		else
			addUser(username, pass);
	}
	else if (/^(del|rem)user [^\s\t]+$/i.test(line)) {
		// remove a user
		var user = line.split(' ')[1];
		
		if (users[user.toString()]) {
			delUser(user.toString());
		} else {
			console.error("Error:\n    User '" + user + "' doesn't exist.");
		}
	}
	else if (/^(stop|end|quit)$/i.test(line)) {
		console.log("Shutting down server...");
		process.exit(0);
	}
	else {
		var command = line.split(' ')[0];
		console.error(`${command} - no such command.`);
	}
}).on('end', () => { // when stdin closes via ^D
	console.log("stdin closed via ^D");
});

function delUser(username) {
	delete users[username.toString()];
	try {
		fs.writeFileSync("users.json", JSON.stringify(users));
		console.log("Successfully deleted user.");
	} catch(err) {
		console.error(`Error writing to users.json:\n${err}`);
		console.error("Deleting user failed.");
	}
}
	
// add a user
function addUser(username, pass) {
	console.log("Adding user...");
	var hashedPass = saltHashPassword(pass);
	var userInfo = {"salt": hashedPass.salt, "hash": hashedPass.passwordHash};
	users[username] = userInfo;
	// update the users file
	try {
		fs.writeFileSync("users.json", JSON.stringify(users));
		console.log("Added user successfully.");
	} catch (err) {
		console.error(`Error writing to users.json:\n${err}`);
		console.error("Adding user failed.");
	}
}

// get a random string
function genRandomString(length) {
	return crypto.randomBytes(Math.ceil(length/2)).toString('hex').slice(0,length);
}

// hash a password
function sha512(pass, salt) {
	var hash = crypto.createHmac('sha512', salt);
	hash.update(pass);
	var value = hash.digest('hex');
	return {
		salt: salt,
		passwordHash: value
	};
}

function saltHashPassword(pass) {
	var salt = genRandomString(64); // salt should be number of bytes that hash is long, so 512 bit hash = 64 byte salt
	var passData = sha512(pass, salt);
	return passData;
}

function checkPass(username, inpass) {
	var salt = users[username.toString()]["salt"];
	var hashedinput = sha512(inpass, salt);
	if (hashedinput.passwordHash == users[username.toString()]["hash"])
		return true;
	else
		return false;
}

// create the server
var server;
if (useHTTPS) {
	var server = https.createServer(SSLOptions, handleServerRequest);
}
else
	var server = http.createServer(handleServerRequest);

function handleServerRequest(request, response) {

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

	var hasAccess = true;

	// if https mode, find out if header contains auth
	if (useAuth && useHTTPS && request.headers.authorization) {
		console.log(`Checking credentials:\n    Host: ${request.headers.host}`);
		// check to make sure user's credentials are correct
		var authHeader = request.headers.authorization;
		if (/^Basic [A-Za-z0-9=+\/]+/.test(authHeader)) {
			// decode Base64 auth header
			var buf = Buffer.from(authHeader.replace(/^Basic /, ""), 'base64');
			var username = buf.toString().replace(/:.+$/, "");
			var pass = buf.toString().replace(/^.+?:/, "");
			
			// now we have to hash the password, assuming the user exists, to see if their password matches
			var correctPass = false;
			if (users[username]) {
				// user exists
				var hashedInfo = saltHashPassword(username, pass);
				// find out if the pass is correct
				var correctPass = checkPass(username, pass);
			} else {
				console.error(`Attempt to login ${username} failed:\n  Invalid username.`);
				correctPass = false;
			}

			if (correctPass) {
				console.log(`Granting ${username} access (${request.headers.host}).`);
				hasAccess = true;
			}
			else {
				console.error(`Denying ${request.headers.host} access:\n    401 - Unauthorized.`);
				hasAccess = false;
			}
		}
		else {
			console.error("Incorrect credentials format.");
			hasAccess = false;
		}
	}
	else if (useAuth && useHTTPS && !request.headers.authorization) {
		console.log(`Denying request due to lack of credentials:\n    Host: ${request.headers.host}`);
		hasAccess = false;
	}

	if (hasAccess && isValidExt && !isInvalid) {
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
						response.end(contents.replace(/\$fileName/, filename.replace(siteDir, "")));
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
	} else if (hasAccess && isInvalid || !isValidExt) {
		console.info(`${filename} - Error 403`);
		var error403 = "<!DOCTYPE html><html><head><title>403 - Access Denied</title></head><body><h1>Error 403</h1><hr/><h2>Access denied.</h2></body></html>";
		// respond with this default 403 error page UNLESS 403.html is found
		fs.readFile(errorPages["403.html"], (err, contents)=>{
			if(!err) {
				response.setHeader("Content-Type", ".html");
				response.setHeader("Content-Length", contents.replace(/\$fileName/, filename.replace(siteDir, "")).length);
				response.statusCode = 403;
				response.end(contents.replace(/\$fileName/, filename.replace(siteDir, "")));
			} else {
				console.log(errorPages["403.html"] + " not found, sending default 403.");
				response.setHeader("Content-Type", ".html");
				response.setHeader("Content-Length", error403.length);
				response.statusCode = 403;
				response.end(error403);
			}
		});
	} else if (!hasAccess) { // issue 401 if user doesn't have proper credentials
		console.info(`${request.headers.host}:\n    Access denied: ${filename}`);
		response.setHeader("WWW-Authenticate", `Newauth realm="site", type=1, title="Login to ${hostname}", Basic realm="simple"`);
		response.statusCode = 401;
		response.end();
	}
}

server.listen(port, hostname);

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

console.log(`Static file server running at\n	=> http${useHTTPS?'s':''}://${hostname}:${port}/\nEnter 'stop' to shutdown.`);
