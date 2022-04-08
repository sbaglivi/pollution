const express = require("express");
const app = express();
const routes = require('./routes');
const passport = require('passport');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const sqlString = require('sqlstring');

// TODO: fix this shit
app.use(express.static('views'));
app.use(express.static('assets'));
app.use(express.static('uploads'));
app.use(express.static('/'))
app.set("view engine", "ejs");

const database = require('./db');
let sessionStore = new MySQLStore({}, database.pool);
app.use(session({
  secret: 'keyboard cat',
  resave: 'false',
  saveUninitialized: 'false',
  store: sessionStore,
}))

// passport.initialize(); doesn't seem needed not sure why it's still here
app.use(passport.authenticate('session'))
app.use('/', routes);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});