const fs = require('fs');

module.exports = {
    makeDirectoryIfNotExists: (path) => {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
    },
    isLoggedIn: (req, res, next) => {
        if (!req.isAuthenticated()) {
            req.session.returnTo = req.originalUrl;
            res.redirect('/login');
        }
        return next();
    }
}