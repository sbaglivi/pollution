const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local');
let database = require('../db');

router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
})

passport.use(new LocalStrategy(async function verify(username, password, done) {
    try {
        let results = await database.query("SELECT * FROM users WHERE username = ?", [username]);
        if (results.length !== 1) return done(null, false, { message: 'username returned 0 or more than 1 row' })
        let match = await bcrypt.compare(password, results[0].hash);
        if (!match) return done(null, false, { message: 'password incorrect' });
        return done(null, results[0]);
    } catch (e) {
        return done(e);
    }
}))

// Functions to go from having a full user to an user id (to save in session?) and back
passport.serializeUser(function (user, cb) {
    cb(null, { id: user.id })
})
passport.deserializeUser(async function (user, cb) {
    try {
        let results = await database.query('SELECT * FROM users WHERE id = ?', [user.id]);
        if (results.length !== 1) cb(null, false, { message: `More than 1 or 0 users with id ${user.id}` })
        cb(null, results[0])
    } catch (e) {
        cb(e);
    }
})

router.route('/login')
    .get((req, res) => res.render('login'))
    .post(passport.authenticate('local', { failureRedirect: '/login', failureMessage: true }), (req, res) => {
        res.redirect(req.session.returnTo || '/'); // sometimes I don't know why but this won't work. I'm assuming since redirecting to '/' works that  req.session.returnTo is a truthy value but an invalid one.
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