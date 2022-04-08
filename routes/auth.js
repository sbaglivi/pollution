const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local');
let database = require('../db');

router.use(passport.authenticate('session'))

// The strategy requires a verify callback, which accepts these credentials and calls done providing a user.
passport.use(new LocalStrategy(async function verify(username, password, done) {
    try {
        let results = await database.query("SELECT * FROM users WHERE username = ?", [username]);
        if (results.length !== 1) return done(null, false, { message: 'Username returned 0 or more than 1 row' });
        let match = bcrypt.compare(password, results[0].hash);
        if (!match) return done(null, false, { message: 'The password is incorrect' });
        return done(null, results[0]);
    } catch (e) {
        return done(e);
    }
}))

// Functions to go from having a full user to an user id (to save in session?) and back
passport.serializeUser(function (user, cb) {
    cb(null, { id: user.id })
})
passport.deserializeUser(function (user, cb) {
    try {
        let results = await database.query('SELECT * FROM users WHERE id = ?', [user.id]);
        if (results.length !== 1) cb(null, false, { message: `More than 1 user found with ${user.id} user id` });
        cb(null, results[0]);
    } catch (e) {
        cb(err);
    }
})

router.route('/login')
    .get((_, res) => res.render('login'))
    .post(passport.authenticate('local', { failureRedirect: '/login', failureMessage: true }), (req, res) => {
        res.redirect(req.session.returnTo || '/');
        delete req.session.returnTo;
    })

router.route("/register")
    .get((_, res) => res.render('register'))
    .post(async (req, res) => {
        let { username, password } = req.body;
        // Stopped checking for username uniqueness since the database now has the field has unique and will throw an error if it's not.
        const SALT_ROUNDS = 10;
        try {
            let salt = await bcrypt.genSalt(SALT_ROUNDS);
            let hash = await bcrypt.hash(password, salt);
            let results = await database.query('INSERT INTO USERS (username, hash) VALUES (?, ?)', [username, hash])
            if (results.affectedRows !== 1) throw Error("User registration ended up creating more or less than 1 row");
            let user = { id: results.insertId, username };
            req.login(user, error => {
                if (error) return next(error);
                res.redirect('/');
            })
        } catch (e) {
            throw e;
        }
    })

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login')
})

module.exports = router;