# node-server
An easy-to-use file server written in Node.js

## Setup
Setup is simple. There are 2 ways of going about it:

**Option 1:**

You can download the latest release from [here](https://github.com/WillEccles/node-server/releases/latest) and extract to your desired location. Once you have done this, you are ready to go to the Usage section!

**Option 2:**

This method is more hands-on than the previous one, but also may contain new features that are working, but aren't large enough for a full release yet. Think of it as a stable beta.

```
$ cd /dir/of/server
$ git clone https://github.com/willeccles/node-server
```

If you *really* want to get the newest, possibly broken, bleeding-edge, rad features that I am in the process of working on, you can do the following after using method 2 above:

```
$ cd /dir/of/server
$ git checkout dev
```

*Disclaimer: I am not responsible for any damage you cause to your server by using the dev branch. You do so at your own risk.*

## Usage
Usage is also simple:

```
$ cd /dir/of/server
$ node server.js [hostname] [port]
```

**`hostname`**: Optional hostname. Overrides `settings.json`.

**`port`**: Optional port. Overrides `settings.json`.

## Settings
In order to set your preferred settings, you just have to go edit/create `settings.json` with your preferred text editor. The defaults for this file can be seen [here](/settings.json). All of the options can be found below—none of them are required.

#### Options:
`"hostname":"string"`: The hostname of the server. This setting is one of the only two that support the `$siteDir` variable at the moment. This means that if you have a folder for a site that's `/my.site.com`, you can set the hostname to `"$siteDir"` and the server will listen at `my.site.com:[port]`. This is particularly useful if you have 4 sites and you may launch the server using different ones at any time.

`"port":Int`: The port of the server.

`"indexFile":"string"`: The index for the server. If not specified, defaults to “/index.html.”

`"siteDirectory":"string"`: The root directory of the site, from which every file will be found.

`"validExts":{"string":"string"}`: Valid extensions and their mime types. Any extensions requested that are not in this list will be responded to with a 403 (access denied) error. You should probably not mess with this unless you need to.

`"invalidFiles":["string"]`: Files that will always return a 403, even if their extensions are valid. Regardless of what you put in this list, `server.js` will *never* be accessible, for security reasons.

`"errorPages":{"string","string"}`: Locations for error pages. By default, the server will look at `/40*.html`, but this behavior can be changed. This setting supports the variable `$siteDir`, which is replaced by the `siteDirectory` string. For example, if `siteDirectory` is `"mysitedir"` and `"403.html"` is set to `"$siteDir/403.html"`, it will look at `"mysitedir/403.html"`. Keep in mind that `$siteDir` ends without a `/`, so you have to add the `/` before `403.html` (like in the previous example). For info on how to create these files, see [Custom Error Files.](https://github.com/WillEccles/node-server#custom-error-files)

## Custom Error Files
In the event of a 403 or 404 error, the user will be served a simple error page. In the event that you want to make custom ones, you can simply create `/403.html` and `/404.html`. For more info, see `"errorPages"` in the [settings documentation.](https://github.com/WillEccles/node-server#settings)

Inside of your error files, you have access to the `$fileName` variable. If the server finds `$fileName` *anywhere* in the html file, it will be replaced with "/filename.ext". For example, if the user tried to get `myfile.html` and that doesn't exist, the server will replace `$fileName` with `/myfile.html`. If the directory setting is not `"/"` or `""`, it **will not** show the directory, only `/myfile.html`, since the directory is the root directory and is considered  `/`.

## Contribution
If you would like to contribute something, please only create pull requests for the master branch, as the dev branch is for me to create and add new features before they are ready for release.
