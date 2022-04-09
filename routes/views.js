const express = require('express');
const { parseCoordinatesFromString, getFormattedDate, isLoggedIn } = require('../functions');
const router = express.Router();
const database = require('../db'); // If I wanted to keep this a cleaner 'only render' file I'd have to switch to full client side rendering. I don't see much of an incentive here so for now I'll keep it split.

// TODO change the root path to somethign else maybe? 
router.get('/', (req, res) => res.redirect('/map'));

router.get('/map', (req, res) => {
    res.render('temp', { user: req.user });
})

router.get('/table', (req, res) => {
    res.render('table')
})

router.get('/submission/:id', async (req, res) => {
    // Right now this uses a db connection, I'm not sure if I should avoid that and just get the data from client js
    try {
        let results = await database.query('SELECT * FROM pollution_sites WHERE id = ?', [req.params.id]);
        if (results.length !== 1) throw Error(`Found more than one submission for id ${req.params.id}`);
        results[0].submission_date = getFormattedDate(results[0].submission_date);
        res.render('submission', { submission: results[0], editingEnabled: results[0].author_id === req.user.id })
    } catch (error) {
        throw error;
    }
})

router.get('/submit/:latlon?', isLoggedIn, (req, res) => {
    let [lat, lon] = ['', '']; // ejs complains that they're undefined otherwise
    if (req.params.latlon) {
        try {
            [lat, lon] = parseCoordinatesFromString(req.params.latlon);
            if ([lat, lon].some(val => Number.isNaN(val) || val === undefined)) throw Error("Got NaN or undefined while trying to parse given coordinates");
        } catch (e) {
            console.log(`Error while trying to parse ${req.params.latlon} as [lat,lon] coordinates.\n${e.message}`)
        }
    }
    res.render("submit2", { lat, lon });
})

router.get('/profile', isLoggedIn, async (req, res) => {
    try {
        let results = await database.query('SELECT * FROM pollution_sites WHERE author_id = ?', [req.user.id]);
        res.render('profile', { submissions: results })
    } catch (error) {
        throw error;
    }
})

module.exports = router;