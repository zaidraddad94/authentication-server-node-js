const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');





const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    default: ''
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    default: ''
  },
 
});


 UserSchema.methods.getSpecificUser = (firstName, cb) => {
  User.find({firstName: name}, (err, result) => {
    if(err){
      return cb(err, null);
    }else{
      return cb(null, result);
    }
  })
}


UserSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

UserSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

UserSchema.methods.generateJwt = function() {
  
  return jwt.sign({
    id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    role : this.role
  }, "jwtSecret"); // secret
}

module.exports = mongoose.model('User', UserSchema);