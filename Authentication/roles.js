const mongoose = require('mongoose');

const rolesSchema = new mongoose.Schema({
  role: {
    type: String,
    default: ''
  },
  arr: {
		type: Array,
		default: []
	}
});

module.exports = mongoose.model('roles', rolesSchema);