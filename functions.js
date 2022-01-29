const fs = require('fs');

module.exports = makeDirectoryIfNotExists = (path) => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }
}