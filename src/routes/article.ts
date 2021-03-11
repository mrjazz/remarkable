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

router.get('/*.md',  (req, res, next) => {
  res.sendFile('/index.html', {'root': `${rootDir}/../public`});
});

router.get('/*.json',  (req, res) => {  
  const tmpPath = path.resolve(docsPath + decodeURI(req._parsedUrl.pathname));
  const fullPath = tmpPath.substr(0, tmpPath.length-4) + 'md';  

  if (validators.validatePath(fullPath)) {
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
    res.sendFile('/index.html', {'root': `${rootDir}/../public`});
  }
  
});

module.exports = router;
