import path = require('path');
import fs = require('fs');

import commander = require('commander');
const program = commander.program;

import wiki = require('./wiki/wiki');


export const rootDir: string = __dirname;

program
  .option('-a, --api-url <url>', 'url to api for client')
  .option('-e, --edit-url <url>', 'edit url in your repository')
  .option('-u, --auth-user <name>', 'name for http authentication')
  .option('-s, --auth-password <password>', 'password for http authentication')
  .option('-p, --path <path>', 'path to wiki directory', `${rootDir}/wiki`);

program.parse(process.argv);

export let docsPath: string = process.env.path ? process.env.path : program.path + '/';
export const urlRepo: string = process.env.editUrl ? program.env.editUrl : program.editUrl;
export const authUser: string = process.env.authUser ? program.env.authUser : program.authUser;
export const authPassword: string = process.env.authPassword ? program.env.authPassword : program.authPassword;

const alternativePath: string = rootDir + '/' + docsPath;

if (fs.existsSync(docsPath)) {
  // passed path exists
} else if (fs.existsSync(alternativePath)) {  
  docsPath = alternativePath;
} else {
  console.log(`Wiki path "${docsPath}" doesn't exist`);
  process.exit(1);
}

console.log('Wiki path: ' + docsPath);

export const docsDir = path.resolve(docsPath);

export const repository = new wiki.Repository(docsPath);
repository.load().then(() => {
  // repository initialized
});

export const resourceExtensions = ['.png', '.gif', '.jpg', '.jpeg', '.md'];

module.exports = {
  repository,
  rootDir,
  docsDir,  
  authUser,
  docsPath,
  authPassword,
  resourceExtensions,
  urlRepo
};
