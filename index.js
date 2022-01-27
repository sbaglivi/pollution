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
const routes = require('./routes');
//  END OF REQUIRE STATEMENTS

app.use(express.static('views'));
app.set("view engine", "ejs");
app.use('/', routes);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});