const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create schema

const DoctorSchema = new Schema( {
    username: {type: String, required:true},
    password: {type: String, required:true},
    name: {type: String, required:true},
    patients: [String],
});

module.exports = Doctor = mongoose.model('doctor',DoctorSchema);