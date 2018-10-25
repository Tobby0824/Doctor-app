const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');
const validator = require('validator');
const passport = require('passport');
const { Strategy, ExtractJwt } = require("passport-jwt");

const port = process.env.PORT || 4000;

/*three dummy data
1.
    name: "Ben",
    username: "Ben22",
    password: "123456",
    patients: ["mat","tom"]
2.
    name: "Jerry",
    username: "Jerry11",
    password: "123456",
    patients: ["Suan","Tom","Jack", "Nancy"]
3.
    name: "Andy",
    username: "Andy123",
    password: "123456",
    patients: [ "Penny","Andrew","Jason","Raymond"]*/
const app = express();

app.use(bodyParser.json());
app.set('trust proxy', 'loopback, 0.0.0.0');

// DB Config
const db = require('./config/keys').mongoURI;

// Connect to Mongo
mongoose
    .connect(db, {useNewUrlParser: true}) // Adding new mongo url parser
    .then(() => console.log('MongoDB Connected...'))
.catch(err => console.log(err));

const Doctor = require('./models/Doctor');


// setup passport
app.use(passport.initialize())
const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: "secret"
};
passport.use(new Strategy(options, (payload, done) => {
    Doctor.findById(payload.id)
        .then(user => user ? done(null, user) : done(null, false))
        .catch(err => console.log(err));
}));

// setup validator
const isEmptyObject = obj => typeof obj === "object" && Object.keys(obj).length === 0;

function validateLogin(data) {
    const errors = {};
    data.username = data.username || "";
    data.password = data.password || "";
    if (validator.isEmpty(data.username)) errors.username = "username is invalid!";
    if (validator.isEmpty(data.password)) errors.password = "password field is required!";
    return { errors, isValid: isEmptyObject(errors) };
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



// get api/doctors from server
app.get('/api/doctors', (req, res) => {
    Doctor.find()
        .then(doctors => res.json(doctors));
});

// post a record from server
app.post('/api/doctors', (req, res) => {
    const newDoctor = new Doctor({
        name: req.body.name,
        username: req.body.username,
        password: req.body.password,
        patients: req.body.patients
    });

    newDoctor.save().then(doctor => res.json(doctor));

});


// login a user
function isMatch(a, b) {
    return a===b;
}
app.post("/api/login", (req, res) => {
    console.log(req.body);
    const { errors, isValid } = validateLogin(req.body);
    const { username, password } = req.body;
    if (!isValid) {
        return res.status(400).json(errors);
    }
    Doctor.findOne({ username })
        .then((user) => {
            if (!user) {
                errors.username = "user not found";
                return res.status(400).json(errors);
            }
            const { patients, name} = user;
            if (isMatch(password, user.password)) {
                // if passwords match generate token and user data to send back
                const payload = { id:user.id, name, patients};
                jwt.sign(payload, "secret", { expiresIn: 3000 }, (err, token) => {
                    res.json({ success: true, token: `Bearer ${token}` });
                });
            } else {
                errors.password = "passwords don't match";
                return res.status(400).json(errors);
            }
        });
});

//get current doctor
app.get("/api/listpatients", passport.authenticate("jwt", { session: false }), (req, res) => {
    Doctor.findOne({ user: req.body.username})
        .then(user => res.json(user.patients));
});



app.listen((port), () => console.log(`Server started on port ${port}`));