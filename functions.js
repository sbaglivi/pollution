const fs = require('fs');

export const makeDirectoryIfNotExists = (path) => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }
}