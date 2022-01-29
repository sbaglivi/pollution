const express = require("express");
const app = express();
const NodeGeocoder = require("node-geocoder");
const options = {
  provider: "openstreetmap",
}
const geocoder = NodeGeocoder(options);
const routes = require('./routes');
const passport = require('passport');
//  END OF REQUIRE STATEMENTS

app.use(express.static('views'));
app.set("view engine", "ejs");

const mysql = require('mysql');
const sql_options = {
  host: 'localhost',
  database: 'pollution',
  user: 'simone',
  password: 'enomis'
}
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const connection = mysql.createConnection(sql_options);
let sessionStore = new MySQLStore({}, connection);
app.use(session({
  secret: 'keyboard cat',
  resave: 'false',
  saveUninitialized: 'false',
  store: sessionStore,
}))
// passport.initialize();
app.use(passport.authenticate('session'))
app.use('/', routes);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});