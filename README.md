# node-server
An easy-to-use file server written in Node.js

## Setup
Setup is simple. All you have to do is the following:

```
$ cd /dir/of/server/
$ git clone https://github.com/willeccles/node-server
```

## Usage
Usage is also simple:

```
$ cd /dir/of/server/
$ node server.js [hostname] [port]
```

**`hostname`**: Optional hostname. Overrides `settings.json`.

**`port`**: Optional port. Overrides `settings.json`.

## Settings
In order to set your preferred settings, you just have to go edit/create `settings.json` with your preferred text editor. The defaults for this file can be seen [here](/settings.json). All of the options can be found below—none of them are required.

#### Options:
`"hostname":"string"`: The hostname of the server.

`"port":Int`: The port of the server.

`"index":"string"`: The index for the server. If not specified, defaults to “/index.html.”

`"validExts":{"string":"string"}`: Valid extensions and their mime types. Any extensions requested that are not in this list will be responded to with a 403 (access denied) error. You should probably not mess with this unless you need to.

`"invalidFiles":["string"]`: Files that will always return a 403, even if their extensions are valid. Regardless of what you put in this list, `server.js` will *never* be accessible, for security reasons.

## Custom Error Files
In the event of a 403 or 404 error, the user will be served a simple error page. In the event that you want to make custom ones, you can simply create `403.html` and `404.html`.