import express = require('express');
import path = require('path');
import etag = require('etag');

import {rootDir, docsPath, repository} from '../resources';
import validators = require('../validators');

import {replaceWikiLinks, markHighlight, renderPage} from '../wiki/utils';
import {Wikilink} from '../wiki/wiki';

const router = express.Router();


interface ArticlePage {
  html: string
  wikilinks: Array<Wikilink>
}

function render(pagePath: string, highlight: string): ArticlePage {
  const html = highlight ?
    markHighlight(renderPage(pagePath), highlight) : renderPage(pagePath);

  const wikilinkedHtml = replaceWikiLinks(html, (link) => repository.link(link));

  return {
    html: wikilinkedHtml,
    wikilinks: repository.wikilinks(pagePath)
  };    
}

const isClientRequest = (headers) => headers['content-type'] &&
    headers['content-type'].toLowerCase().startsWith('application/json');

router.get('/*.md',  (req, res) => {  
  const fullPath = path.resolve(docsPath + req._parsedUrl.pathname);  

  if (isClientRequest(req.headers) && validators.validatePath(fullPath)) {
    if (path.extname(fullPath.toLowerCase()) == '.md') {
      try {
        const data = render(fullPath, req.query.highlight);
        const cacheTag = etag(JSON.stringify(data));
        res.setHeader('Etag', cacheTag);
        res.json(data);
      } catch(e) {
        console.log(e)
        res.status(400).json({error: e.message});
      }
    } else {      
      res.sendFile(fullPath);
    }
  } else {
    res.sendFile(`${rootDir}/public/index.html`);
  }
  
});

module.exports = router;
