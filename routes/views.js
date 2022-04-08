const express = require('express');
const router = express.Router();

router.get('/map', (req, res) => {
    // res.render('map');
})

router.get('/table', (req, res) => {

})

router.get('/submission/:id', (req, res) => {

})

router.get('/submit', isLoggedIn, (req, res) => {

})

router.get('/profile', isLoggedIn, (req, res) => {

})

module.exports = router;