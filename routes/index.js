const express = require("express");
const router = express.Router();
const multer = require("multer");
const sharp = require("sharp");
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const mysql = require("mysql");
const passport = require('passport');
const LocalStrategy = require('passport-local');
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'simone',
    password: 'enomis',
    database: 'pollution'
})
passport.use(new LocalStrategy(function verify(username, password, cb) {
    connection.query("SELECT * FROM users WHERE username = ?", [username], (err, results, fields) => {
        if (err) return cb(err)
        if (results.length !== 1) return cb(null, false, { message: 'Username returned 0 or more than 1 row' });

        bcrypt.compare(password, results[0].hash, (err, result) => {
            if (err) return cbb(err);
            if (!result) return cb(null, false, { message: 'The password is incorrect' })
            return cb(null, results[0]);
        })
    })
}))
passport.serializeUser(function (user, cb) {
    cb(null, { id: user.id })
})
passport.deserializeUser(function (user, cb) {
    connection.query("SELECT * FROM users WHERE id = ?", [user.id], (err, results, fields) => {
        if (err) cb(err);
        if (results.length !== 1) cb(null, false, { message: 'More than 1 user found with given username' })
        cb(null, results[0]);
    })
})
const SALT_ROUNDS = 10;
const UPLOADS_DIR = 'uploads/';
const RESIZED_DIR = 'resized';
const storage = multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
        cb(null, file.fieldname + Date.now());
    }
})
const upload = multer({
    storage: storage,
})
// import { makeDirectoryIfNotExists } from "../functions.mjs";
// Basically I found support for imports in nodejs but you can't really mix imports and requires so I think it's just better to stick with require for now
const helpers = require("../functions");
router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", (req, res) => {
    res.render("home", { user: req.user });
});
router.get("/features", (req, res) => {
    connection.query("SELECT * FROM features", (err, results, fields) => {
        if (err) throw err;
        // console.log(results);
        res.set('Access-Control-Allow-Origin', '*');
        res.status(200).send({ results: results });
    })
})
router.route('/upload')
    .get((req, res) => {
        res.render('upload');
    })
    .post(upload.single('evidence'), async (req, res, next) => {

        const { filename: fileName } = req.file;

        helpers.makeDirectoryIfNotExists(UPLOADS_DIR + RESIZED_DIR);
        await sharp(req.file.path)
            .resize(200, 200)
            .jpeg({ quality: 90 })
            .toFile(
                path.resolve(UPLOADS_DIR, RESIZED_DIR, req.file.filename)
            )
        fs.unlinkSync(req.file.path);
        res.redirect('/upload');
    })
/*
router.post('/upload', upload.single('evidence'), async (req, res, next) => {
    // req.body contains the text fields, the image upload input must have name = evidence
    // console.log(req.file);

    const { filename: fileName } = req.file;

    await sharp(req.file.path)
        .resize(200, 200)
        .jpeg({ quality: 90 })
        .toFile(
            path.resolve(req.file.destination, 'resized', fileName)
        )
    fs.unlinkSync(req.file.path);
    res.redirect('/upload');
})
*/
router.get('/search', (req, res) => {
    res.render('search');
})
router.get('/geocode/:data', async (req, res) => {
    let results = await geocoder.geocode(req.params.data);
    res.status(200).send({ results: results });
})
router.route("/submit")
    .get((req, res) => {
        res.render("submit");
    })
    .post((req, res) => {
        // Handle submit
    })
router.route("/register")
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {
        // Get data from post request, possibly check if the fields are all okay (username is not taken etc);
        let username = req.body.username;
        let password = req.body.password;
        connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results, fields) => {
            if (err) throw err;
            if (results.length > 0) {
                // Username is already taken
                // Return early or do whatever you need to
            }
        })
        bcrypt.genSalt(SALT_ROUNDS, (err, salt) => {
            bcrypt.hash(password, salt, (err, hash) => {
                // Insert user into database
                // Redirect
                connection.query('INSERT INTO users (username, hash) VALUES (?, ?)', [username, hash], (err, results, fields) => {
                    if (err) throw err;
                    if (results.affectedRows === 1) {//  Success!
                        console.log('User correctly registered');
                        let user = { id: results.insertId, username: username }
                        req.login(user, function (err) {
                            if (err) return next(err);
                            res.redirect('/');
                        })
                    } else {
                        // Something went wrong since either none or multiple rows were affected by the insert
                        console.log(results)
                        return;
                    }
                })
            })
        })
    })
router.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post(passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureMessage: true })) //, (req, res) => {
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login')
})
// Check if login is successful
//         let username = req.body.username;
// let password = req.body.password;
// connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results, fields) => {
//     if (err) throw err;
//     if (results.length !== 1) console.log(`Userame: ${username} returned more than 1 row`)
//     bcrypt.compare(password, results[0].hash, (err, result) => {
//         if (result) console.log('Congratulations, the password is correct!');
//         else console.log('The password is not correct');
//     })
// })


// })
/*
router.get("/submit", (req, res) => {
res.render("submit");
})
router.post("/submit", (req, res) => {
// Handle submit
})
*/
router.get("/pollution", (req, res) => {
    // shows a map with points wherever pollution has been signaled.
})
router.get("*", (req, res) => {
    res.send("You've reached a dead end");
});
module.exports = router;