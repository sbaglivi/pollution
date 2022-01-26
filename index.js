const express = require("express");
const app = express();
const mysql = require("mysql");
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
const multer = require('multer');
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + Date.now());
  }
})
const upload = multer({ storage: storage });
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
app.use(express.static('views'));
app.set("view engine", "ejs");
app.get("/", (req, res) => {
  res.render("home");
});
app.get("/features", (req, res) => {
  connection.query("SELECT * FROM features", (err, results, fields) => {
    if (err) throw err;
    // console.log(results);
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200).send({ results: results });
  })
})
app.get('/upload', (req, res) => {
  res.render('upload');
})
app.post('/upload', upload.single('evidence'), async (req, res, next) => {
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
app.get('/search', (req, res) => {
  res.render('search');
})
app.get('/geocode/:data', async (req, res) => {
  let results = await geocoder.geocode(req.params.data);
  res.status(200).send({ results: results });
})
app.get("/submit", (req, res) => {
  res.render("submit");
})
app.post("/submit", (req, res) => {
  // Handle submit
})
app.get("/pollution", (req, res) => {
  // shows a map with points wherever pollution has been signaled.
})
app.get("*", (req, res) => {
  res.send("You've reached a dead end");
});
app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
