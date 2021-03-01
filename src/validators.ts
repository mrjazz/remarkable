import resources = require('./resources');
import fs = require('fs');


export const validatePath = (fullPath) => {
  return fullPath.substr(0, resources.docsDir.length) === resources.docsDir &&
    fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile();
}

module.exports = {
  validatePath
}
