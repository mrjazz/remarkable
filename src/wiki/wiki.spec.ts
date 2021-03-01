import assert = require('assert');
import 'mocha';
import * as wiki from './wiki';
import * as highlight from './utils';


const wikiPath  = './wiki';

describe('Highlight', function() {
  it('read file', async function() {
    const result = await wiki.read(wikiPath + '/code-of-conduct.md');
    assert(result, "read should return content");
    const lines = result.split("\n");
    assert.strictEqual(133, lines.length);
    assert.strictEqual("# Code of Conduct", lines[0]);
  });

  it('text highlight', async function() {
    assert.strictEqual("hello <span class='found'>world</span>", highlight.markHighlight('hello world', 'world'));
  });

  it('in link highlight', async function() {
    assert.strictEqual(
      "begin <a href=\"/world\">hello <span class='found'>w</span>orld</a> end",
      highlight.markHighlight('begin <a href="/world">hello world</a> end', 'w')
    );
  });

  it('surrounded highlight', async function() {
    assert.strictEqual(
      "<span class='found'>w</span> <a href=\"/world\">hello <span class='found'>w</span>orld</a> <span class='found'>w</span>",
      highlight.markHighlight('w <a href="/world">hello world</a> w', 'w')
    );
  });

  it('highlight in urls', async function() {
    const markdown = '<li><a href="https://site.com/test-case">Test Case</a></li>';
    assert.strictEqual(
      "<li><a href=\"https://site.com/test-case\">Test <span class='found'>case</span></a></li>",
      highlight.markHighlight(markdown, 'case')
    );
  })
});

describe('Wiki', function() {
  it('scan validation', async function() {
    const result = await wiki.scan(wikiPath);

    const tree = result.tree;
    const links = result.links;
    const references = result.references;
    const wikilinks = result.wikilinks;

    // console.log(references);
    // console.log(links);

    // console.log(tree.map((i, k) => console.log(k, i.name)));

    assert.strictEqual(Array.from(result.links).length, 70, 'not the same as find . -name "*.md" | wc -l');
    assert.strictEqual(17, tree.length)
    assert.strictEqual('404.md', tree[0].name)
    assert.strictEqual('/404.md', tree[0].path)
    assert.strictEqual('Page not found!', tree[0].title);

    assert.strictEqual('dev', tree[4].name)
    assert.strictEqual('/dev', tree[4].path)
    assert(tree[4].items);
    assert.strictEqual(12, tree[4].items.length)  

    assert.strictEqual('/404.md', links.get('404.md'));
    assert.strictEqual('/publishing/generate-gatsby-site.md', links.get('generate-gatsby-site.md'));

    const contribution = references.get('contribution-guide.md');    
    assert(contribution);
    assert.strictEqual(4, contribution.length);
    assert(contribution.includes('principles.md'));
    assert(contribution.includes('code-of-conduct.md'));
    assert(contribution.includes('architecture.md'));
    assert(contribution.includes('tutorial-adding-a-new-command-to-the-vs-code-extension.md'));    
    
    const architectureLinks = wiki.getWikilinkByPath(wikilinks, links, 'architecture.md');
    assert.strictEqual(architectureLinks.length, 1);
    assert.strictEqual(architectureLinks[0].wikilink, 'contribution-guide.md');
    assert.strictEqual(architectureLinks[0].link, '/contribution-guide.md');

    
    const contributionLinks = architectureLinks.map((n: any) => n.wikilink); // check all wikilinks    
    assert.strictEqual(contributionLinks.length, 1);
    assert(contributionLinks.includes('contribution-guide.md'));

    const emptyLinks = wiki.getWikilinkByPath(wikilinks, links, 'null.md');
    assert.strictEqual(emptyLinks.length, 0);
    
    assert.strictEqual(highlight.replaceWikiLinks('begin [[xxx]] end', () => false), 'begin [[xxx]] end');
    assert.strictEqual(highlight.replaceWikiLinks('begin [[xxx]] end', () => '/yyy'), 'begin <a href="/yyy">[[xxx]]</a> end');
  });

  it('search in dir', async function() {
    const result = await wiki.searchAndSort(wikiPath, 'foam');
    assert.strictEqual(45, result.length);
  });

  it('occurrences', async function() {
    const result = wiki.occurrences('aa\nbb\naaaaa\nbbaa', 'aa bb');
    assert.strictEqual('aa', result[0].line)
    assert.strictEqual(1, result[1].lineNum)
    assert.strictEqual(2, result[2].occurences)
  });

  it('readMeta', async function() {
    const result = await wiki.readMeta(wikiPath + '/big-vision.md');
    assert.strictEqual('Big Vision', result.title);
  });

  it('modified', function() {
    const result = wiki.modified(wikiPath, 0, 100);
    result.items.reduce((a: any, b: any) => {
      assert(a['mtime'] >= b['mtime'], 'wrong ogder of modified files');
      return b;
    })
    assert.strictEqual(71, result.items.length);
    assert.strictEqual(71, result.totalFiles);
  });
});

describe('HTML renderer', function() {
  it('wikilinks parse', async function() {
    const repository = new wiki.Repository(wikiPath);
    await repository.load();
    
    const html = highlight.renderPage(wikiPath + '/contribution-guide.md');
    const wikilinkedHtml = highlight.replaceWikiLinks(html, (link) => repository.link(link));    
    assert(wikilinkedHtml.indexOf('<a href="/principles.md">[[principles]]</a>') > 0, 'wrong wikilink replacement');

    const wikilinks = repository.wikilinks('contribution-guide.md');    
    assert.strictEqual(wikilinks.length, 6, 'wrong count of wikilinks parsed');
  });

  it('html in markdown', async function() {       
    const markdown = '<p>text</p>'; 
    const html = highlight.renderMarkdown(markdown);
    assert.strictEqual(html, markdown, 'markdown parser should ignore html');
  });

  it('markdown parse', async function() {       
    const markdown = '# Title\n - 111\n - 222'; 
    const html = highlight.renderMarkdown(markdown);
    const expected = '<h1>Title</h1>\n<ul>\n<li>111</li>\n<li>222</li>\n</ul>\n';
    assert.strictEqual(html, expected, 'markdown parser should ignore html');
  });

  it('foam cleanup', async function() {
    const markdown = highlight.readContentFromFile(wikiPath + '/contribution-guide.md');
    const html = highlight.foamCleanUp(markdown);
    assert.strictEqual(
      html.split("\n").length, 68,
      'After foam clean up "Autogenerated link references" should be removed'
    );
  });
});
