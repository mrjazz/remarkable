# Remarkable Wiki

[![npm version](https://badge.fury.io/js/remarkablewiki.svg)](https://badge.fury.io/js/remarkablewiki)

Is a lightweight and functional readonly interface for work with your markdown documents.

You can see an example [here](https://remarkablewiki.herokuapp.com/).

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
> heroku login
> heroku git:remote -a remarkablewiki
> git commit -am "init"
> git push heroku master
```

## CLI

Easy to start from terminal:
```
> npm install remarkablewiki
> ./node_modules/.bin/remarkablewiki -p /your/wiki
```
