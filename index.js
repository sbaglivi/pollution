const express = require("express");
const app = express();
const passport = require('passport');
const bodyParser = require('body-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const authRoutes = require('./routes/auth');
const viewsRoutes = require('./routes/views');
const apiRoutes = require('./routes/api');

// TODO: fix this shit
app.use(express.static('views'));
app.use(express.static('assets'));
app.use(express.static('uploads'));
app.use(express.static('/'))
app.set("view engine", "ejs");
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const database = require('./db');
let sessionStore = new MySQLStore({}, database.pool);
app.use(session({
  secret: 'keyboard cat',
  resave: 'false',
  saveUninitialized: 'false',
  store: sessionStore,
}))

app.use(passport.authenticate('session'))
app.use('/', authRoutes);
app.use('/', viewsRoutes);
app.use('/api', apiRoutes);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});