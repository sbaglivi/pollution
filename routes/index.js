const express = require("express");
const router = express.Router();
const multer = require("multer");
const sharp = require("sharp");
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const mysql = require("mysql");
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'simone',
    password: 'enomis',
    database: 'pollution'
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
// import { makeDirectoryIfNotExists } from "../functions";
router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", (req, res) => {
    res.render("home");
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

        // THIS NEEDS TO BE FIXED SAYS CANT USE IMPORT OUTSIDE A MODULE
        // makeDirectoryIfNotExists(UPLOADS_DIR + RESIZED_DIR);
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
                        res.redirect('/login');
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
    .post((req, res) => {
        // Check if login is successful
        let username = req.body.username;
        let password = req.body.password;
        connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results, fields) => {
            if (err) throw err;
            if (results.length !== 1) console.log(`Userame: ${username} returned more than 1 row`)
            bcrypt.compare(password, results[0].hash, (err, result) => {
                if (result) console.log('Congratulations, the password is correct!');
                else console.log('The password is not correct');
            })
        })

    })
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