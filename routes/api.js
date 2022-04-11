const express = require('express');
const router = express.Router();
const NodeGeocoder = require("node-geocoder");
const geocoder = NodeGeocoder({ provider: 'openstreetmap' });
const database = require('../db');
const path = require('path');
const multer = require('multer');
const { makeDirectoryIfNotExists, deleteFile, isLoggedIn, processAndSaveImage, getFormattedDate, createUniqueImageName, buildUpdateString } = require('../functions');
const [UPLOADS_DIR, RESIZED_DIR] = ['uploads/', 'resized'];
const storage = multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
        cb(null, file.fieldname + Date.now()); // wanted to user req.body.filename but seems multer processes that after the file has been saved
    }
})
const upload = multer({ storage })

router.get('/getAllSubmissions', async (req, res) => {
    try {
        let results = await database.query('SELECT * FROM pollution_sites');
        res.status(200).json(results);
    } catch (error) {
        throw error;
    }
})

// I'm not 100% sure but picture comes from either the name of the file upload input or from the parameters set in multer configuration
router.post('/createSubmission', isLoggedIn, upload.single('picture'), async (req, res) => {
    try {
        makeDirectoryIfNotExists(UPLOADS_DIR + RESIZED_DIR);
        let imageName = createUniqueImageName(req.body.name);
        await processAndSaveImage(req.file.path, 200, 200, 90, path.resolve(UPLOADS_DIR, RESIZED_DIR, imageName))
        deleteFile(req.file.path);
        let [date, description, author, authorId, hideAuthor] = [getFormattedDate(), req.body.description || "", req.user.username, req.user.id, req.body.hideAuthor === 'true'];
        await database.query("INSERT INTO pollution_sites (latitude, longitude, name, image_name, author, author_id, description, hide_author, submission_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [req.body.latitude, req.body.longitude, req.body.name, imageName, author, authorId, description, hideAuthor, date]);
        res.redirect('/submit')
    } catch (e) {
        res.send('There was an error while saving the image or saving the data in the database: ' + e.message);
        throw e;
    }
})

/*
Next 2 need to verify that whoever is accessing the route has authorization -> author_id = user_id. To verify this: I can grap user id from req object.
If I grab the author_id from the request I can get faked and update a submission id of someone else. I can just do an update where author_id = req.user.id and id = req.params.id
*/
router.put('/updateSubmission/:id', isLoggedIn, async (req, res) => {
    try {
        sqlString = buildUpdateString('pollution_sites', req.body, { id: req.params.id, author_id: req.user.id });
        let results = await database.query(sqlString);
        if (results.changedRows !== 1) throw Error("More or less than one row was updated");
        let updatedRows = await database.query('SELECT * FROM pollution_sites WHERE id = ?', [req.params.id])
        res.json(updatedRows[0]);
    } catch (error) {
        throw error;
    }
})

router.delete('/deleteSubmission/:id', isLoggedIn, async (req, res) => {
    // TODO add something to delete the image relative to submission
    try {
        let result = await database.query('DELETE FROM pollution_sites WHERE id = ? AND author_id = ?', [req.params.id, req.user.id]);
        if (result.affectedRows !== 1) throw Error("Either no rows were deleted because you don't have authorization or multiple were deleted because there were duplicates");
        res.send(`Submission with id ${req.params.id} deleted correctly`);
    } catch (error) {
        throw error;
    }
})

router.get('/geocoding/:data', async (req, res) => {
    try {
        let results = await geocoder.geocode(req.params.data);
        res.status(200).send(results);
    } catch (error) {
        throw error;
    }
})

module.exports = router;