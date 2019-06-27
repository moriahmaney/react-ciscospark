const path = require('path');

const {runInPackage} = require('./package');

function npmPublishPackage(pkgName, pkgPath) {
  return runInPackage({
    constructCommand: (targetPath) => `cd ${path.resolve(targetPath)} && ls && npm pack`,
    commandName: 'Publish Package to NPM',
    pkgName,
    pkgPath
  });
}

module.exports = {
  npmPublishPackage
};
