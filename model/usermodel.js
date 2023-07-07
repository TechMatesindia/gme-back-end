const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  username:{
    type:String,
    required: true
  },
  name:{
    type:String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  Contact_No:{
    type:Number,
    required: true
  },
  DOB:{
    type:String,
    required: true
  },
  image:{
    type:String,
    required: false
  },
  current_org:{
    type:String,
    required: false
  },
  current_dest:{
    type:String,
    required: false
  },
  address:{
    type:String,
    required: false
  },
  Experience:{
    type:String,
    required: false
  },
  Qualification:{
    type:String,
    required: false
  },
  Current_salary:{
    type:String,
    required: false
  },
  salary_goal_1_year:{
    type:String,
    required: false
  },
  salary_goal_3_year:{
    type:String,
    required: false
  },
  exams:{
    type:String,
    required: false
  },
  Remaining_attempt:{
    type:String,
    required: false
  },
  marks:{
    type:String,
    required:false
  }
});



const User = mongoose.model('people', userSchema);

module.exports = User;