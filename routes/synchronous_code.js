
// deserialize user
database.pool.query('SELECT * FROM users WHERE id = ?', [user.id], (err, results) => {
    if (err) cb(err);
    if (results.length !== 1) cb(null, false, { message: `More than 1 user found with ${user.id} user id` });
    cb(null, results[0]);
})
// strategy
// The strategy requires a verify callback, which accepts these credentials and calls done providing a user.
// Using an asynchronous function doesn't seem to work. I think since async funcitons always return a promise 
passport.use(new LocalStrategy(function verify(username, password, done) {
    database.pool.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) return done(e)
        if (results.length !== 1) return done(null, false, { message: 'Username returned 0 or more than 1 row' });
        bcrypt.compare(password, results[0].hash, (err, match) => {
            if (err) return done(e);
            if (!match) return done(null, false, { message: 'The password is incorrect' });
            return done(null, results[0]);
        });
    })
}));