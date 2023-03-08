const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const hbs = require('hbs')
const db = require('../db/db')
const bodyParser = require('body-parser')
const hash = require('bcrypt')
const { body, validationResult } = require('express-validator')
const passport = require('./utils/passport')
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
  });


const port = process.env.PORT || 3000
const publicDirectory = path.join(__dirname, '../public')
const viewsDirectory = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')

app.set('view engine', 'hbs')
app.set('views', viewsDirectory)
hbs.registerPartials(partialsPath)

app.use(express.static(publicDirectory))
app.use(bodyParser.urlencoded({extended: true}))

app.get('/',  (req,res) => {

    res.render('index')
})

app.get('/register', (req,res) => {
    res.render('register')
})

app.get('/login', (req,res) => {
    res.render('login')
})

app.post('/login',
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login'
    })
);

app.post('/register', [
    body('name').notEmpty(),
    body('email').notEmpty(),
    body('passport').notEmpty(),
    body('repassport').notEmpty(),
], async(req,res) => {

    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        return res.json({
            status : false,
            message : 'All fields are required'
        })
    }

    const { name, email, passport, repassport } = req.body
    
    if (passport != repassport) {
        return res.json({
            status : false,
            message : 'Password not match'
        })
    }

    try {

        const emailQuery = `SELECT * FROM users WHERE email=$1`;
        const emailValue = [email]
        const { rows:user } = await db.query(emailQuery, emailValue)

        if(user.length > 0) {
            return res.json({
                status : false,
                message : "A user with this email already registered"
            })
        }

        const newPassword = await hash.hash(passport, 10)
        const queryText = `INSERT INTO users (name, email, passport) VALUES ($1, $2, $3)`;
        const values = [name, email, newPassword]
        await db.query(queryText, values)

    } catch(e) {
        return res.json({
            status : false,
            message : e
        })
    } 

    res.json({
        status: true,
        message: 'User registered successfully'
    })
})

app.get('/logout', (req,res) => {

    req.logout((err) => {
        if(err) {
            return next(err)
        }
    });
    res.json({
        status : true,
        message : 'Logout is successful'
    })
})

server.listen(port, () => {
    console.log(`Server is up on ${port}`)
})
