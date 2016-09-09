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
`"hostname":"string"`: The hostname of the server. This setting is one of the only two that support the `$siteDir` wildcard at the moment. This means that if you have a folder for a site that's `/my.site.com`, you can set the hostname to `"$siteDir"` and the server will listen at `my.site.com:[port]`. This is particularly useful if you have 4 sites and you may launch the server using different ones at any time.

`"port":Int`: The port of the server.

`"indexFile":"string"`: The index for the server. If not specified, defaults to “/index.html.”

`"siteDirectory":"string"`: The root directory of the site, from which every file will be found.

`"validExts":{"string":"string"}`: Valid extensions and their mime types. Any extensions requested that are not in this list will be responded to with a 403 (access denied) error. You should probably not mess with this unless you need to.

`"invalidFiles":["string"]`: Files that will always return a 403, even if their extensions are valid. Regardless of what you put in this list, `server.js` will *never* be accessible, for security reasons.

`"errorPages":{"string","string"}`: Locations for error pages. By default, the server will look at `/40*.html`, but this behavior can be changed. This setting supports the wildcard `$siteDir`, which is replaced by the `siteDirectory` string. For example, if `siteDirectory` is `"mysitedir"` and `"403.html"` is set to `"$siteDir/403.html"`, it will look at `"mysitedir/403.html"`. Keep in mind that `$siteDir` ends without a `/`, so you have to add the `/` before `403.html` (like in the previous example).

## Custom Error Files
In the event of a 403 or 404 error, the user will be served a simple error page. In the event that you want to make custom ones, you can simply create `/403.html` and `/404.html`. For more info, see `"errorPages"` in the [settings documentation.](https://github.com/WillEccles/node-server#settings)
