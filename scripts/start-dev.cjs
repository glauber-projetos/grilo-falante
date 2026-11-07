// Starts the development server (port 9095) from any working directory,
// also when the project path contains spaces (e.g. "Documents\grilo falante").
const path = require('path');
const root = path.resolve(__dirname, '..');
process.chdir(root);
process.argv = [process.argv[0], path.join(root, 'node_modules/webpack-dev-server/bin/webpack-dev-server.js')];
require(process.argv[1]);
