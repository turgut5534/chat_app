const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const db = require('../../db/db'); // assuming you have a separate file to establish the database connection

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!user || !user.rows || user.rows.length === 0) {
        return done(null, false, { message: 'Incorrect email or password.' });
    }
    const hashedPassword = user.rows[0].passport
    const passwordMatch = await bcrypt.compare(password.toString(), hashedPassword.toString());
    if (!passwordMatch) {
        return done(null, false, { message: 'Incorrect email or password.' });
    }
    return done(null, user.rows[0]);
}));


passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, user.rows[0]);
});

module.exports = passport;