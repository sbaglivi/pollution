const express = require("express");
const router = express.Router();
const multer = require("multer");
const sharp = require("sharp");
const path = require('path');
const fs = require('fs');
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
import { makeDirectoryIfNotExists } from "../functions";

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
        makeDirectoryIfNotExists(UPLOADS_DIR + RESIZED_DIR);
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