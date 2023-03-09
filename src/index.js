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


app.get('/',  async(req,res) => {

    // if(!req.isAuthenticated()) {
    //     return res.redirect('/login')
    // }

    const query = `SELECT * FROM users;`
    const { rows:users } = await db.query(query)
    
    
    res.render('index', {
        users: users
    })
})

app.get('/register', (req,res) => {
    res.render('register')
})

app.get('/login', (req,res) => {
    res.render('login')
})

app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }

      const { email, password } = req.body

      if(!email || !password) {
        return res.status(401).json({ message: 'All inputs are required.' });
      }

      if (!user) {
        return res.status(401).json({ message: 'Incorrect email or password.' });
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.status(200).json({ message: 'Login successful!' });
      });
    })(req, res, next);
  });
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

app.post('/message', async(req,res) => {

    const data = req.body

    try {

        const queryText = `INSERT INTO messages(sender_id, recipient_id, message, sent_at)
        VALUES($1, $2, $3, $4)`
        const values = [ data.id ,data.recipient_id ,data.message, new Date()]

        await db.query(queryText, values)
        console.log('Message saved')

        io.emit('message', data)

    } catch(error) {
        
        res.sendStatus(500);
        return console.log('error',error);
    }

})

app.get('/messages/:user', (req,res) => {

    // io.join(req.params.user)

    res.render('messages', {
        recipient_id : req.params.user
    })
})

io.on('connection', () =>{
    console.log('a user is connected')
})
  

server.listen(port, () => {
    console.log(`Server is up on ${port}`)
})
