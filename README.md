# Remarkable Wiki

Is a lightweight and functional readonly interface for wotk with your markdown documents.

## Features

 - Text search
 - Backlinks/wikilinks syntax
 - Http authorization
 - Mobile friendly
 - Cusomizable

## Configuration

```
> node dist/server.js --help
Usage: server [options]

Options:
  -a, --api-url <url>             url to api for client
  -e, --edit-url <url>            edit url in your repository
  -u, --auth-user <name>          name for http authentication
  -s, --auth-password <password>  password for http authentication
  -p, --path <path>               path to wiki directory (default: "/app/wiki")
  -h, --help                      display help for command
```

You can configure all the parameters in package.json:

```
    ...
    "start": "node ./dist/server.js -p ../wiki -u user -s password",
    ...
```

## Heroku

It's heroku friendly. You can put in `wiki` directory your markdown files, publish the app on Heroku and make it accessable through web interface.

```
```