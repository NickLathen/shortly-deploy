var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var mongoose = require('../mongod');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  mongoose.urls.find({}, function(err, urls) {
    if (err) { throw err; }
    res.status(200).send(urls);
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;
  
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  mongoose.urls.find({'url': uri}, function(err, urls) {
    if (err) { throw err; }
    if (urls.length > 0) {
      res.status(200).send(urls[0]);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }
        var shasum = crypto.createHash('sha1');
        shasum.update(uri);
        var code = shasum.digest('hex').slice(0, 5);
        mongoose.urls.create({url: uri,
          title: title,
          baseUrl: req.headers.origin, 
          code: code,
          visits: 0
        }, function(err, newLink) {
          
          res.status(200).send(newLink);
        });
      });
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  mongoose.users.find({'username': username}, function(err, users) {
    if (err) { throw error; }
    if (users.length === 0) {
      res.redirect('/login');
    } else {
      //SHOULD CALL COMPARE PASSWORD OF USERS
      if (users[0].password === password) {
        util.createSession(req, res, users[0]);
      } else {
        res.redirect('/login');
      }
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  mongoose.users.find({'username': username}, function(err, users) {
    if (err) { throw err; }
    if (users.length === 0) {
      mongoose.users.create({'username': username, 'password': password}, function(err, user) {
        // TODO: implement session
        util.createSession(req, res, user);

      });
    } else {
      console.log('Account already exists');
      res.redirect('/signup');
    }
  });
};

exports.navToLink = function(req, res) {

  mongoose.urls.find({'code': req.params[0] }, function(err, urls) {
    if (urls.length === 0) {
      console.log('could not find url');
      res.redirect('/');
    } else {
      console.log('ended up in the right place?');
      urls[0].visits = urls[0].visits + 1 || 1;
      urls[0].save();
      res.redirect(urls[0].url);
    }
  });
};