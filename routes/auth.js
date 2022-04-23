const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local');
let database = require('../db');
const { isNotLoggedIn } = require('../functions');

router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
})

passport.use(new LocalStrategy(function verify(username, password, done) {
    try {
        database.pool.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
            if (err) throw err;
            if (results.length !== 1) {
                console.log(`found 0 or more than 1 user with that username`)
                return done(null, false, { message: 'username returned 0 or more than 1 row' })
            }
            bcrypt.compare(password, results[0].hash, (err, match) => {
                if (err) throw err;
                if (!match) {
                    console.log(`username and password not valid`)
                    return done(null, false, { message: 'password incorrect' });
                }
                console.log(`everything went correctly, should be logged in`)
                return done(null, results[0]);
            })

        });
    } catch (e) {
        return done(e);
    }
}))

// Functions to go from having a full user to an user id (to save in session?) and back
passport.serializeUser(function (user, cb) {
    cb(null, { id: user.id, username: user.username })
})
passport.deserializeUser(function (user, cb) {
    try {
        database.pool.query('SELECT * FROM users WHERE id = ?', [user.id], (err, results) => {
            if (err) throw err;
            if (results.length !== 1) cb(null, false, { message: `More than 1 or 0 users with id ${user.id}` })
            cb(null, results[0])
        });
    } catch (e) {
        cb(e);
    }
})

// when authentication fails it seems that it just doesn't call next? -> it seems to just return 401 when it fails. I have to try to write my own callback if I want to handle failed logins better than just redirecting.
// (I could also just give up and use whatever flash messages package they use)
router.route('/login')
    .get(isNotLoggedIn, (req, res) => res.render('login'))
    /*
        .post(isNotLoggedIn, passport.authenticate('local', { failureRedirect: '/login', failureMessage: true }), (req, res) => {
            req.session.notification = { type: 'success', message: `Welcome back!`, shown: false }
            //Todo This often redirects to login and it's even preventing the redirect away done by middleware so needs fixing.
            console.log(`logged in, trying to redirect to ${req.session.returnTo}\nreq.user is ${req.user} and authenticated is ${req.isAuthenticated()}`)
            console.log(req.user);
            let redirectUrl = req.session.returnTo || '/';
            delete req.session.returnTo;
            req.session.save(err => {
                if (err) throw err;
                console.log(`Inside the callback`)
                res.redirect(redirectUrl); // sometimes I don't know why but this won't work. I'm assuming since redirecting to '/' works that  req.session.returnTo is a truthy value but an invalid one.
            })
            console.log(req.session.save.constructor.name)
            console.log(`After the callback`)
        })
        */
    .post(isNotLoggedIn, (req, res, next) => {
        passport.authenticate('local', function (err, user, info) {
            console.log(`Authentication attempt:`)
            console.log(err);
            console.log(user);
            console.log(info)
            if (err) return next(err);
            if (!user) {
                req.session.notification = { type: 'error', message: 'Credentials incorrect' };
                req.session.save(err => {
                    if (err) return next(err);
                    console.log(`After failed authentication attempt I'm trying to redirect to login`)
                    return res.redirect('/login')
                })
            } else {
                req.login(user, err => {
                    if (err) return next(err);
                    let redirectUrl = req.session.returnTo || '/';
                    delete req.session.returnTo;
                    req.session.save(err => {
                        if (err) return next(err);
                        req.session.notification = `Welcome back, ${user.username}`;
                        res.redirect(redirectUrl);
                    })
                })
            }
        })(req, res, next);
    })

router.route("/register")
    .get(isNotLoggedIn, (_, res) => res.render('register'))
    .post(isNotLoggedIn, async (req, res) => {
        let { username, password } = req.body;
        // Stopped checking for username uniqueness since the database now has the field has unique and will throw an error if it's not.
        const SALT_ROUNDS = 10;
        try {
            let salt = await bcrypt.genSalt(SALT_ROUNDS);
            let hash = await bcrypt.hash(password, salt);
            let results = await database.query('INSERT INTO users (username, hash) VALUES (?, ?)', [username, hash])
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

router.post('/logout', (req, res) => {
    req.logout();
    req.session.save(err => {
        if (err) throw err;
        res.redirect('/login') //Todo if the user gets redirect to the same page he's on the page won't reload and the interface will still look as if user is logged in. Since it seems that I can't force a page refresh from the server I'm redirecting to one of the few routes that cannot be the same as the one the user is coming from.
    })
    // console.log('done logging out')
    // I think the issue is that if I try to logout when I'm on the login page, the url is already the one that express wants to redirect to and therefore nothing updates.
    // if I want to keep redirecting to login I need to make sure the user is not already on that page, I need a system that redirect user if they try to visit login when they're already logged in.
})

module.exports = router;