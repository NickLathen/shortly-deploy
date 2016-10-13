
var mongoose = require('mongoose');
// don't need to have separate create db syntax
var mongoose = mongoose.connect('mongodb://localhost/shortly');

var urlSchema = mongoose.Schema({url: 'string', baseUrl: 'string', code: 'string', title: 'string', visits: 'number', timestamp: 'date'});
var userSchema = mongoose.Schema({username: 'string', password: 'string', timestamp: 'date'});

var url = mongoose.model('Url', urlSchema);
var user = mongoose.model('User', userSchema);

mongoose.users = user;
mongoose.urls = url;

module.exports = mongoose;