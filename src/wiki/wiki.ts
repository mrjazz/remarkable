import console = require('console');
import fs = require('fs');
const fsp = fs.promises;
import path = require('path');
import {markHighlight, fileToTitle, formatLink} from './utils';

// import promisify = require('util');


const exclude: Array<string> = ['node_modules', 'public'];

type Argument<T> = T extends (arg: infer U, callback: infer X) => any ? U : any;
type Callback<T> = T extends (arg: infer U, callback: infer X) => any ? X : any;

export function promisify<V, S extends (arg: Argument<S>, callback: Callback<S>) => void>(fn: S): (arg: Argument<S>) => Promise<V> {
  return arg =>
    new Promise((resolve, reject) => {
      try {
        const callback = (d: V) => {
          resolve(d);
        };
        fn(arg, callback as Callback<typeof fn>);
      } catch (e) {
        reject(e);
      }
    });
}

export async function read(filePath): Promise<any> {
    if(!fs.lstatSync(filePath).isFile()) {
        return `File ${filePath} not found`
    }

    return await fs.promises.readFile(filePath, "utf8");
}

function addToMap(map: Map<string, any>, k: string, v: any) {
    const oldLink = map.get(k);
    if (oldLink) {
        if (oldLink.indexOf(v) < 0) { // insert only once
            map.set(k, oldLink.concat(v)); // cause array or value can be passed
        }
    } else {
        map.set(k, [].concat(v));
    }
}

function isMarkdown(fileName) {
    return fileName.substr(-3).toLowerCase() == '.md';
}

type TreeItemGeneric<T> = {
    name: string
    items?: T[]
    path: string
    title?: string
}

interface TreeItem extends TreeItemGeneric<TreeItem> {}

interface TreeItems extends Array<TreeItem> {}

interface WikiTreeInternal {
    links: Map<string, string>
    references: Map<string, string[]>    
    tree: TreeItems
}

interface WikiTree extends WikiTreeInternal {
    wikilinks: Map<string, string[]>
}

export async function scan(directory: string): Promise<WikiTree> {    
    const result = await scanDirectory(directory, directory);
    const wikilinks = new Map();    
    result.references.forEach((links, linkName) => {
        links.forEach((l) => addToMap(wikilinks, l, linkName));
    });

    // console.log(result.tree[4].items);
    
    return {
        tree: result.tree,
        links: result.links,
        references: result.references,
        wikilinks: wikilinks
    };
}

async function scanDirectory(directory: string, prefix: string): Promise<WikiTreeInternal> {
    const links = new Map();
    const references = new Map();    
    const addLink = (v: string, k: string) => links.set(k, v);
            
    const prefixPath = path.resolve(prefix);    
    const tree: TreeItems = [];
    
    let files = await fsp.readdir(directory, {withFileTypes: true});
    for (let f of files) {
        let fullPath = path.resolve(path.join(directory, f.name));
        if (exclude.includes(f.name)) {
            continue;
        }
        const articlePath = fullPath.substr(prefixPath.length);
        if (f.isDirectory()) {
            const tmp = await scanDirectory(fullPath, prefix);
            tree.push({
                name: f.name, items: tmp.tree, path: articlePath
            });
            tmp.links.forEach(addLink);
            tmp.references.forEach((v, k) => addToMap(references, k, v));            
        } else {
            if (isMarkdown(f.name)) {
                const meta = await readMeta(fullPath);
                const linkName = formatLink(f.name)

                meta.links.forEach((v) => addToMap(references, linkName, v));                

                tree.push({
                    name: f.name,
                    title: meta.title,
                    path: articlePath
                });
                
                addLink(articlePath, linkName);
            }
        }
    }
    return {tree, links, references};
}

interface SearchResult {
    name: string
    path: string
    occurences: Array<SearchOccurences>
}

async function search(directory, text): Promise<Array<SearchResult>> {
    let results: Array<SearchResult> = [];
    let files = await fsp.readdir(directory, {withFileTypes: true});
    for (let f of files) {
        let fullPath = path.resolve(path.join(directory, f.name));
        if (exclude.includes(f.name)) {
            continue;
        }
        if (f.isDirectory()) {
            const result = await search(fullPath, text);
            results = results.concat(result);
        } else {
            if (path.extname(fullPath.toLowerCase()) != '.md') {
                continue;
            }

            const content = await read(fullPath);
            const result = occurrences(content, text);
            if (result && result.length > 0) {
                results.push({
                    name: f.name,
                    path: fullPath,
                    occurences: result
                })
            }
        }
    }
    return results;
}

interface SearchOccurences {
    line: string
    lineNum: number
    occurences: number
}

export function occurrences(string, searchString, allowOverlapping = false): Array<SearchOccurences> {
    const result: Array<SearchOccurences> = [];
    string += "";
    searchString += "";
    if (searchString.length <= 0) return (string.length + 1);

    string.split("\n").map((line, lineNum) => {
        let n = 0;
        searchString.split(' ').map((subString) => {
            subString = subString.trim();
            if (subString === '') return;

            let pos = 0;
            let step = allowOverlapping ? 1 : subString.length;

            while (true) {
                pos = line.indexOf(subString, pos);
                if (pos >= 0) {
                    ++n;
                    pos += step;
                } else break;
            }

        });

        if (n > 0) {
            result.push({
                line: markHighlight(line, searchString),
                lineNum: lineNum,
                occurences: n
            })
        }
    });
    return result;
}

export async function searchAndSort(directory, text) {
    const prefixPath = path.resolve(directory);
    const result = await search(directory, text);
    const occurences = r => r.occurences.reduce((a, b) => {
        return b.occurences + a
    }, 0);
    return result
        .sort((a, b) => occurences(b) - occurences(a))
        .map(r => {
            r.path = r.path.substr(prefixPath.length);
            return r;
        });
}

interface FileMetadata {
    title: string
    links: string[]
}

export async function readMeta(filePath: string): Promise<FileMetadata> {    
    const content = await read(filePath);    
    
    let title = content.match(/#(.*?)\n/);
    if (title) {
        title = title[1].trim();
    } else {
        title = fileToTitle(filePath);
    }
        
    const tags = [...content.matchAll(/\[\[(.*?)\]\]/g)];
    const links = tags.map(i => formatLink(i[1]));    

    return {title, links};
}

function fileNameInLower(f) {
    return f.toLowerCase().split('/').pop()
}

interface FileInfo {
    name: string
    path: string
    mtime: Date
}

interface ModifiedFiles {
    items: Array<FileInfo>
    totalFiles: Number
}

export function modified(docsPath, skip = 0, limit = 30): ModifiedFiles {
    const files: Array<FileInfo> = [];
    const walkSync = (d) => {
        if (fs.statSync(d).isDirectory()) {
            return fs.readdirSync(d)
                .map(f => walkSync(path.join(d, f)));
        }
        const fileName = fileNameInLower(d);
        if (isMarkdown(fileName)) {
            files.push({
                name: fileName,
                path: d.substr(fullPath.length),
                mtime: fs.statSync(d).mtime
            });
            // console.log(d, files.length);
        }
    };

    const fullPath = path.resolve(docsPath);
    walkSync(fullPath);

    const totalFilesCount = files.length;
    
    return {
        items: files
            .sort((a: FileInfo, b: FileInfo) => b.mtime.valueOf() - a.mtime.valueOf())
            .splice(Number(skip), Number(limit)),
        totalFiles: totalFilesCount
    }
}

export function getWikilinkByPath(wikilinks, links, filename) {
    // const filename = fileNameInLower(path);
    const foundWikilinks = wikilinks.get(filename);    

    if (!foundWikilinks) {
        return [];
    }
    return foundWikilinks.map((wikilink) => {
        return {
            wikilink: wikilink,
            link: links.get(wikilink)
        };
    });
}

export interface Wikilink {
    wikilink: string
    link: string
}

export class Repository {

    private state?: WikiTree;
    private docsPath: string;

    constructor(docsPath) {  
        this.docsPath = docsPath;              
    }

    async load() {        
        const res = await scan(this.docsPath).then((r) => this.state = r);
        // console.log(this.state && this.state.links);
    }
    
    get(kind) {
        return this.state && this.state[kind];
    }

    link(link) {        
        return this.state && this.state.links.get(formatLink(link));
    }

    wikilinks(link: string): Array<Wikilink> {
        const filename = formatLink(link);        
        return this.state && getWikilinkByPath(
            this.state.wikilinks,
            this.state.links,
            filename
        );
    }

    articlesOrderedByModification (skip = 0, limit = 30) {
        const result = modified(this.docsPath, skip, limit);        
        // TODO : add titles in result
        // result.items.map((i) => {});
        return result;
    }
}
