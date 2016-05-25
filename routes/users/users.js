var express = require('express');
var db = require('../db');
var router = express.Router();
var users;
/* GET users listing. */
router.get('/users', function(req, res, next) {
  db.bind('users');
  db.users.find().toArray(function(err, items) {
    users = items;
    db.close();
    if (items){
      res.render('users', { title: 'Users', users: items });
    }
   else {
      res.send("cannot find users")
    }

  });
});
router.all('/user/:id/:op?', function(req, res, next){
  var id = req.params.id;
  req.user = users[id];
  if (req.user) {
    next();
  } else {
    var err = new Error('cannot find user ' + id);
    err.status = 404;
    next(err);
  }
});
router.get('/user/:id', function(req, res){
  res.render('users/view', {
    title: 'Viewing user ' + req.user.name,
    user: req.user
  });
});
router.get('/user/:id/view', function(req, res){
  res.render('users/view', {
    title: 'Viewing user ' + req.user.name,
    user: req.user
  });
});
router.get('/user/:id/edit', function(req, res){
  res.render('users/edit', {
    title: 'Editing user ' + req.user.name,
    user: req.user
  });
});

module.exports = router;
