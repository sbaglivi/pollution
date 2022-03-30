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
const NodeGeocoder = require("node-geocoder");
const options = {
    provider: "openstreetmap",
}
const geocoder = NodeGeocoder(options);
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
        // I wanted to use req.body.filename here to use the final name but apparently multer doesn't process that data until after the file has been saved, I'll have to rename it afterwards.
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


// Views Routes
router.get("/", (req, res) => {
    connection.query("SELECT * FROM pollution_sites", (err, results, fields) => {
        if (err) throw err;
        res.render("home", { user: req.user, submissions: results });
    })
});
router.get('/map', (req, res) => {
    res.render('temp', { user: req.user });
})
router.get('/table', (req, res) => {
    res.render('table');
})
router.get("/features", (req, res) => {
    connection.query("SELECT * FROM features", (err, results, fields) => {
        if (err) throw err;
        // console.log(results);
        res.set('Access-Control-Allow-Origin', '*');
        res.status(200).send({ results: results });
    })
})
router.get('/pollution_sites', (req, res) => {
    connection.query("SELECT * FROM pollution_sites", (err, results, fields) => {
        if (err) throw err;
        res.set('Access-Control-Allow-Origin', '*');
        res.status(200).send({ results: results });
    })
})
router.route('/upload')
    .get((req, res) => {
        res.render('upload');
    })
    .post(upload.single('picture'), async (req, res, next) => {

        const { filename: fileName } = req.file;
        console.log(req.file.path)
        console.log(`requested filename is ${req.body.name}`);

        helpers.makeDirectoryIfNotExists(UPLOADS_DIR + RESIZED_DIR);
        await sharp(req.file.path)
            .resize(200, 200)
            .jpeg({ quality: 90 })
            .toFile(
                path.resolve(UPLOADS_DIR, RESIZED_DIR, req.body.name + Date.now())
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
    .get(helpers.isLoggedIn, (req, res) => {
        res.render("submit");
    })
    .post(helpers.isLoggedIn, upload.single('picture'), async (req, res, next) => {

        // const { filename: fileName } = req.file;
        // console.log(req.file.path)
        let imageName = req.body.name + Date.now();
        imageName = imageName.replace(/\s+/g, '_').toLowerCase();
        try {
            helpers.makeDirectoryIfNotExists(UPLOADS_DIR + RESIZED_DIR);
            await sharp(req.file.path)
                .resize(200, 200)
                .jpeg({ quality: 90 })
                .toFile(
                    path.resolve(UPLOADS_DIR, RESIZED_DIR, imageName)
                )
            fs.unlinkSync(req.file.path);
        } catch (e) {
            res.send('There was an error while saving the image: ' + e.message);
        }
        let today = new Date();
        let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        let description = req.body.description || "";
        let author = req.user.username;
        let hideAuthor = req.body.hideAuthor === 'true';
        try {
            connection.query("INSERT INTO pollution_sites (latitude, longitude, name, image_name, author, description, hide_author, submission_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [req.body.latitude, req.body.longitude, req.body.name, imageName, author, description, hideAuthor, date])
        } catch (e) {
            res.send(`Error while trying to save the data in the database:\n${e.message}`);
        }
        res.redirect('/submit')

    })
    .post(helpers.isLoggedIn, (req, res) => {
        // Handle submit
    })
router.get('/submissions/:id', (req, res) => {
    connection.query('SELECT * FROM pollution_sites WHERE id = ?', [req.params.id], (err, results, fields) => {
        if (err) throw err;
        if (results.length !== 1) {
            console.log(`Found more than a single instance of submissions with id ${req.params.id}`);
            console.log(req.originalUrl)
        }
        console.log(Object.keys(results[0].submission_date))
        for (let key in results[0].submission_date) {
            console.log(`${key} - ${results[0].submission_date[key]}`);
        }
        let date = new Date(results[0].submission_date);
        results[0].submission_date = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        res.render('submission', { submission: results[0] })
    })
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
    .post(passport.authenticate('local', { failureRedirect: '/login', failureMessage: true }), (req, res) => {
        res.redirect(req.session.returnTo || '/');
        delete req.session.returnTo;
    }) //, (req, res) => {
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
    console.log(req.originalUrl);
    res.send("You've reached a dead end");
});
module.exports = router;