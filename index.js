const express = require("express");
const app = express();
const passport = require('passport');
const bodyParser = require('body-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const authRoutes = require('./routes/auth');
const viewsRoutes = require('./routes/views');
const apiRoutes = require('./routes/api');
const VIEW_ROUTES = ['/map', '/table', '/submit', '/profile']
const AUTH_ROUTES = ['/login', '/register'];

// TODO: fix this shit
// app.use(express.static('views'));
app.use(express.static('assets'));
app.use(express.static('uploads'));
// app.use(express.static('/'))
app.set("view engine", "ejs");
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const database = require('./db');
let sessionStore = new MySQLStore({}, database.pool);
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
}))

app.use((req, res, next) => {
  res.locals.notification = "";
  res.locals.module = false; // table views import a class, to do that the import needs to have 'module' type. This sets it as false default so I don't have to change each header import to have module: false.
  if (VIEW_ROUTES.includes(req.originalUrl) || AUTH_ROUTES.includes(req.originalUrl)) {
    console.log(`trying to visit ${req.originalUrl}, previously was on: ${req.session.previousUrl}`)
    if (AUTH_ROUTES.includes(req.session.previousUrl) && VIEW_ROUTES.includes(req.originalUrl)) {
      console.log(`just reset return to since I was coming from an auth route and I visited a view`)
      req.session.returnTo = '';
    }
    req.session.previousUrl = req.originalUrl;

    if (req.session?.notification) {
      res.locals.notification = req.session.notification;
      delete req.session.notification;
    }
  }
  next();
})

app.use(passport.authenticate('session'))
app.use('/', authRoutes);
app.use('/api', apiRoutes);
app.use('/', viewsRoutes);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
