var express = require('express');
var router = express.Router();
var db = require('../models');
var passwordHandler = require('../logic/passwordHandler');
var profileEvents = require('../logic/profileEvents');

/* GET users listing. */
router.get('/', function(req, res, next) {
    db.User.findAll({})
    .then(function(dbGet) {
      res.json(dbGet);
    });

});

/* GET for single user listing. */
// TODO: remove `canEdit`, this should be from $_SESSION variable
// TODO: backend logic to only query upcoming events, ignore past events
router.get('/getuser/:id', function(req, res) {
  db.User.findOne({
    where: {
      id: req.params.id
    }
  })
    .then(function(dbGet) {
      console.log(JSON.stringify(dbGet, null, 2));
      // var profileObj = dbGet;
      var profileObj = null;

      if (typeof profileObj === 'undefined' || profileObj == null) {
        profileObj = {
          title     : 'Profile', 
          id        : req.params.id,
          avatar    : 1,
          email     : 'test@testeste.edu',
          username  : 'Andy K',
          canEdit   : true,
          invites   : [
            {
              id    : 0,
              name  : "Andy's Lan Party",
              date  : "12/12",
              location    : "Andy's Place",
              description : "This is the best LAN party in the world!",
              rsvp  : false,
            },
            {
              id    : 1,
              name  : "Brendan's Pool Party",
              date  : "12/21",
              location    : "Brendan's Place",
              description : "This is the best POOL party in the world!",
              rsvp  : true
            }
          ]
        }
        res.render('profile', profileObj);
      }
      db.UserEvent.findAll({
        attributes: ["status"],
        where: {
          UserId: req.params.id
        },
        include: [db.Event]
      })
        .then(function(events) {
          var categorizedEvents = profileEvents.categorize(events, profileObj.id);
          console.log(JSON.stringify({
            title: 'Profile',
            id: profileObj.id,
            avatar: profileObj.avatar,
            email: profileObj.email,
            username: profileObj.username,
            invites: categorizedEvents.invited,
            hosting: categorizedEvents.hosting
          }, null, 2));
          res.render('profile', {
            title: 'Profile',
            id: profileObj.id,
            avatar: profileObj.avatar,
            email: profileObj.email,
            username: profileObj.username,
            invites: categorizedEvents.invited,
            hosting: categorizedEvents.hosting
          });
      })
    });
});

/* User sign up route */
router.post('/signup', function(req, res, next) {
  let password = req.body.password;
  let username = req.body.username;
  let email = req.body.email;
  let avatar = req.body.avatar;
  passwordHandler.hashPassword(password, function(hashedPassword) {
    db.User.create({
      password: hashedPassword,
      username: username,
      email: email,
      avatar: avatar
    }).then(function(savedUser) {
      return res.status(200).json(savedUser).end();
    }).catch(function (err) {
      console.log(err);
      return res.status(409).end();
    });
  });
});
/** Signs a user in and starts a session */
router.post('/signin', function(req, res, next) {
  let email = req.body.email;
  let password = req.body.password;

  db.User.findOne({
    where: {
      email: email
    }
  }).then(function(myUser) {
    passwordHandler.comparePassword(password, myUser.password, function(success) {
      if (success) {
        req.session.user = myUser;
        res.status(200).json(req.session.user).end();
      }
      else {
        res.status(404).end();
      }
    });
  });
});
/** Signs a user out and ends the session */
router.get('/signout', function(req, res, next) {
  req.session.destroy();
  res.render('index');
});
/** Deletes user from database */
router.delete('/delete/:userId', function(req, res, next) {
  db.User.destroy({
    where: {
      id: req.params.userId
    }
  })
    .then(function(results) {
      res.status(200).end();
    });
});
/** Checks if a user is signed in with the session */
router.get('/userpresent', function(req, res, next) {
  if(!req.session.user) {
    return res.send(false).end();
  }
  else return res.send(true).end();
});
/** Returns all of the events a user is associated with */
router.get('/:id/events', function(req, res, next) {
  db.UserEvent.findAll({
    attributes: ["status"],
    where: {
      UserId: req.params.id
    },
    include: [db.Event]
  })
    .then(function(events) {
      res.status(200).json(events).end();
  })
  .catch(function(err) {
    if (err) {
      console.log(err);
      res.status(500).end();
    }
  });
});

module.exports = router;