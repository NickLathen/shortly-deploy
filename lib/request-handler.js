var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');
var Users = require('../app/collections/users');
var Links = require('../app/collections/links');
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

  // Links.reset().fetch().then(function(links) {
  //   res.status(200).send(links.models);
  // });
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
          code: code
        }, function(err, newLink) {
          
          res.status(200).send(newLink);
        });
      });
    }
  });

  // new Link({ url: uri }).fetch().then(function(found) {
  //   if (found) {
  //     res.status(200).send(found.attributes);
  //   } else {
  //     util.getUrlTitle(uri, function(err, title) {
  //       if (err) {
  //         console.log('Error reading URL heading: ', err);
  //         return res.sendStatus(404);
  //       }
  //       var newLink = new Link({
  //         url: uri,
  //         title: title,
  //         baseUrl: req.headers.origin
  //       });
  //       newLink.save().then(function(newLink) {
  //         Links.add(newLink);
  //         res.status(200).send(newLink);
  //       });
  //     });
  //   }
  // });
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

  // new User({ username: username })
  //   .fetch()
  //   .then(function(user) {
  //     if (!user) {
  //       res.redirect('/login');
  //     } else {
  //       user.comparePassword(password, function(match) {
  //         if (match) {
  //           util.createSession(req, res, user);
  //         } else {
  //           res.redirect('/login');
  //         }
  //       });
  //     }
  //   });
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

  // new User({ username: username })
  //   .fetch()
  //   .then(function(user) {
  //     if (!user) {
  //       var newUser = new User({
  //         username: username,
  //         password: password
  //       });
  //       newUser.save()
  //         .then(function(newUser) {
  //           console.log('SQL newUser', newUser);
  //           Users.add(newUser);
  //           util.createSession(req, res, newUser);
  //         });
  //     } else {
  //       // console.log('Account already exists');
  //       // res.redirect('/signup');
  //     }
  //   });
};

exports.navToLink = function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      link.set({ visits: link.get('visits') + 1 })
        .save()
        .then(function() {
          return res.redirect(link.get('url'));
        });
    }
  });
};