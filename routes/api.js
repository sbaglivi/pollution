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
        let temp;
        console.log(req.query) //TODO remove me
        for (let key in req.query) {
            console.log(`req query key is ${req.query[key]}`)
            temp = JSON.parse(req.query[key]);
            console.log(temp, typeof temp)
        }
        res.status(200).json(results);
    } catch (error) {
        throw error;
    }
})
router.get('/getSubmissions', async (req, res) => {
    try {
        let currentUserOnly, fields;
        if (req.query.currentUserOnly) {
            currentUserOnly = JSON.parse(req.query.currentUserOnly)
        }
        if (req.query.fields)
            fields = JSON.parse(req.query.fields);
        console.log(fields)
        let sqlQuery = buildQuery(currentUserOnly ? req.user.id : '', fields);
        let results = await database.query(sqlQuery);
        res.status(200).json(results);
    } catch (err) {
        throw err;
    }
})
const buildQuery = (userId, fields) => {
    let query = `SELECT${fields.map(field => ' ' + field)} FROM pollution_sites`;
    if (userId)
        query += ' WHERE author_id = ' + userId;
    return query;
}
const deleteUserAndSubmissions = async userId => {
    try {
        await database.query('DELETE FROM pollution_sites WHERE author_id = ?', [userId]);
        await database.query('DELETE FROM users WHERE id = ?', [userId]);
    }
    catch (e) {
        throw e;
    }
}

// I'm not 100% sure but picture comes from either the name of the file upload input or from the parameters set in multer configuration
router.post('/createSubmission', isLoggedIn, upload.single('picture'), async (req, res) => {
    try {
        makeDirectoryIfNotExists(UPLOADS_DIR + RESIZED_DIR);
        let imageName = createUniqueImageName(req.body.name);
        await processAndSaveImage(req.file.path, path.resolve(UPLOADS_DIR, RESIZED_DIR, imageName))
        deleteFile(req.file.path);
        let [date, description, author, authorId, hideAuthor] = [getFormattedDate(), req.body.description || "", req.user.username, req.user.id, req.body.hideAuthor === 'true'];
        await database.query("INSERT INTO pollution_sites (latitude, longitude, name, image_name, author, author_id, description, hide_author, submission_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [req.body.latitude, req.body.longitude, req.body.name, imageName, author, authorId, description, hideAuthor, date]);
        req.session.notification = { type: 'success', message: `Successfuly created submission ${req.body.name}` };
        res.redirect('/table') //TODO update to /map
    } catch (e) {
        res.send('There was an error while saving the image or saving the data in the database: ' + e.message);
        throw e;
    }
})

/*
Next 2 need to verify that whoever is accessing the route has authorization -> author_id = user_id. To verify this: I can grap user id from req object.
If I grab the author_id from the request I can get faked and update a submission id of someone else. I can just do an update where author_id = req.user.id and id = req.params.id
*/
router.put('/updateSubmission/:id', isLoggedIn, upload.single('picture'), async (req, res) => {
    try {
        let previousData = null;
        if (req.file) { // is there a new image to be handled?
            // TODO: check if in an update query you can get as a result the old values to skip the first dbquery. same for delete query in delete route.
            previousData = await database.query("SELECT * FROM pollution_sites WHERE id = ?", [req.params.id]); // even if the user is changing the title and I don't need the old one to generate new imagename, I still need old imagename to delete it.
            let submissionName = req.body.name ? req.body.name : previousData[0].name;
            let imageName = createUniqueImageName(submissionName)
            await processAndSaveImage(req.file.path, path.resolve(UPLOADS_DIR, RESIZED_DIR, imageName))
            deleteFile(req.file.path);
            req.body.image_name = imageName;
        }
        sqlString = buildUpdateString('pollution_sites', req.body, { id: req.params.id, author_id: req.user.id });
        let results = await database.query(sqlString);
        if (results.changedRows !== 1) throw Error("More or less than one row was updated");
        if (req.file) deleteFile(path.resolve(UPLOADS_DIR, RESIZED_DIR, previousData[0].image_name)); // I'd prefer doing it earlier but if there's a problem while inserting in db I might end up deleting an image without replacing it
        res.status(200).send('Submission updated correctly');
    } catch (error) {
        throw error;
    }
})

router.delete('/deleteSubmission/:id', isLoggedIn, async (req, res) => {
    try {
        let previousData = await database.query('SELECT image_name FROM pollution_sites WHERE id = ?', req.params.id);
        let result = await database.query('DELETE FROM pollution_sites WHERE id = ? AND author_id = ?', [req.params.id, req.user.id]);
        deleteFile(path.resolve(UPLOADS_DIR, RESIZED_DIR, previousData[0].image_name));
        if (result.affectedRows !== 1) throw Error("Either no rows were deleted because you don't have authorization or multiple were deleted because there were duplicates");
        req.session.notification = { message: `Submission deleted`, type: 'success' }
        req.session.save(err => {
            if (err) throw err;
            res.status(200).json({ redirectUrl: '/profile' })
        })
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