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
    },
    isAuthorized: (req, res, next) => {
        if (!req.isAuthenticated() || req.user.id != req.params.userId) {
            console.log(`req.params.userId ${req.params.userId} !== req.user.id ${req.user.id}`);
            res.redirect('/');
        }
        return next();
    }


}