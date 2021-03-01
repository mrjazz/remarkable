#! /usr/bin/env node
// require('source-map-support').install();

// console.log(__dirname);

import express = require('express');
import cors = require('cors');
import path = require('path');
import fs = require('fs');

import dotenv = require('dotenv');

dotenv.config();

import cookieParser = require('cookie-parser');
import resources = require('./resources');
import validators = require('./validators');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public'), {
    etag: true,
    lastModified: true,
    // setHeaders: (res, path) => {
    //   if (path.endsWith('.html')) {
    //     res.setHeader('Cache-Control', 'no-cache');
    //   }
    // },
}));

app.use(cookieParser());

// ONIX : BEGIN
app.use(require('./middlewares/auth.middleware'));
// ONIX : END

app.use(require('./routes/index'));

app.all('*', (req, res) => {
    const fullPath = path.resolve(resources.docsPath + decodeURI(req.path));
    if (
        validators.validatePath(fullPath) &&
        fs.existsSync(fullPath) &&
        fs.lstatSync(fullPath).isFile() &&
        resources.resourceExtensions.includes(path.extname(fullPath.toLowerCase()))
    ) {
        return res.sendFile(fullPath); // if resource is allowed and existing send it
    }
    res.sendFile(`${resources.rootDir}/public/index.html`);
});

app.listen(PORT, function () {
    console.log(`Server starts on port ${PORT}`);
});
