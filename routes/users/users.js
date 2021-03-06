var express = require('express');
var dbPool = require('../db');
var router = express.Router();
var users;

// Session-persisted message middleware
router.use(function (req, res, next) {

  if(req.session.user){
    next();
  }
  else {
    res.redirect('/login');
  }

});
/* GET users listing. */
router.get('/users', function(req, res, next) {
  dbPool.acquire(function(err, db) {
    if (err) {
      res.send(err)
    }
    else {
      db.bind('users');
      db.users.find().toArray(function(err, items) {
        dbPool.release(db);
        users = items;
        if (items){
          res.render('users', { title: 'Users', users: items });
        }
        else {
          res.send("cannot find users")
        }

      });
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
    user: req.user,
    id:req.params.id
  });
});
router.get('/user/:id/view', function(req, res){
  res.render('users/view', {
    title: 'Viewing user ' + req.user.name,
    user: req.user,
    id:req.params.id
  });
});
router.get('/user/:id/edit', function(req, res){
  res.render('users/edit', {
    title: 'Editing user ' + req.user.name,
    user: req.user
  });
});

module.exports = router;
