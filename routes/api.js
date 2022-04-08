const express = require('express');
const router = express.Router();
const NodeGeocoder = require("node-geocoder");
const geocoder = NodeGeocoder({ provider: 'openstreetmap' });
const database = require('../db');
const sharp = require("sharp");
const path = require('path');
const fs = require('fs');
const [UPLOADS_DIR, RESIZED_DIR] = ['uploads/', 'resized'];
const storage = multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
        cb(null, file.fieldname + Date.now()); // wanted to user req.body.filename but seems multer processes that after the file has been saved
    }
})
const upload = multer({ storage })

// TODO Move all functions to an external file and then use object destructuring to import the ones you need. (inludes the fs.unlink so we can avoid another import);
async function processAndSaveImage(initialPath, width, height, quality, finalPath) {
    try {
        await sharp(initialPath).resize(width, height).jpeg({ quality: quality }).toFile(finalPath)
    } catch (error) {
        throw error;
    }
}
function createUniqueImageName(submissionName) {
    let imageName = submissionName + Date.now();
    imageName = imageName.replace(/\s+/g, '_').toLowerCase();
    return imageName;
}
const getFormattedDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMontH() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

router.get('/getAllSubmissions', async (req, res) => {
    try {
        let results = await database.query('SELECT * FROM pollution_sites');
        res.status(200).send(results);
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
        fs.unlinkSync(req.file.path);
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

})

router.delete('/deleteSubmission/:id', isLoggedIn, async (req, res) => {
    try {
        let result = await database.query('DELETE * FROM pollution_sites WHERE id = ? AND author_id = ?', [req.params.id, req.user.id]);
        // TODO: check what kind of result is given to make sure that deletion was successful.
        console.log(result);
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