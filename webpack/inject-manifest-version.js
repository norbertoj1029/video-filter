const path = require('path');
const pkg = require('../package.json');

/**
 * copy-webpack-plugin transform: manifest.version comes from package.json (single source of truth).
 */
function injectManifestVersion(content, absoluteFrom) {
  if (path.basename(absoluteFrom) !== 'manifest.json') {
    return content;
  }
  const manifest = JSON.parse(content.toString());
  manifest.version = pkg.version;
  return Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
}

module.exports = injectManifestVersion;
