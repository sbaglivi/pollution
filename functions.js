const fs = require('fs');

module.exports = {
    makeDirectoryIfNotExists: (path) => {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
    },
    isLoggedIn: (req, res, next) => {
        if (!req.user) {
            res.redirect('/login');
        }
        next();
    }
}