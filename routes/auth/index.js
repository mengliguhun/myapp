/**
 * Module dependencies.
 */
var express = require('express');
var hashc = require('./pass').hash;
var session = require('express-session');
var router = express.Router();
var db = require('../db');
module.exports = router;

// middleware
router.use(session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 'shhhh, very secret'
}));
// Session-persisted message middleware
router.use(function (req, res, next) {
    var err = req.session.error;
    var msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.err = '';
    res.locals.success = '';
    if (err) res.locals.err = err ;
    if (msg) res.locals.success =  msg ;
    next();
});

router.get('/', function (req, res) {
    res.redirect('/login');
});

router.get('/restricted', restrict, function (req, res) {
    res.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
});

router.get('/logout', function (req, res) {
    // destroy the user's session to log them out
    // will be re-created next request
    req.session.destroy(function () {
        res.redirect('/');
    });
});
router.get('/register', function (req, res) {
    res.render('auth/register');
});
router.get('/register', function (req, res) {
    res.render('auth/register');
});
router.post('/login', function (req, res) {

    res.render('auth/login');
});

router.post('/login', function (req, res) {
    authenticate(req.body.username, req.body.password, function (err, user) {
        if (user) {
            // Regenerate session when signing in
            // to prevent fixation
            req.session.regenerate(function () {
                // Store the user's primary key
                // in the session store to be retrieved,
                // or in this case the entire user object
                req.session.user = user;
                req.session.success = '用户<a href="/logout">注销</a>. '
                    + ' 你能够<a href="/restricted">跳往注销界面</a>.';
                res.redirect('back');
            });
        } else {
            req.session.error = '登录失败，用户名或密码错误';
            res.redirect('/login');
        }
    });
});
function register(name,pass,pass1,fn){
    if (!module.parent) console.log('register %s:%s', name, pass);
    if (!name){
        return fn(new Error('昵称不能空'));
    }
    db.bind('users');
    db.users.find({name:name}).limit(1).next(function (err, item) {
        // query the db for the given username
        db.close();
        if (err) return fn(err);
        if (item) return fn(new Error('昵称已存在'));
        if(pass && pass1){
            if (pass == pass1){
                var user;
                user.name = name;
                user.password = pass;

                hashc(pass, function (err, salt, hash) {
                    if (err) throw err;
                    // store the salt & hash in the "db"
                    user.salt = salt;
                    user.hash = hash;
                    //update db
                    db.bind('users');
                    db.users.save(user);
                    db.close();

                });
            }
            else {
                return fn(new Error('密码不一致'));
            }
        }
    });
}
// Authenticate using our plain-object database of doom!

function authenticate(name, pass, fn) {
    if (!module.parent) console.log('authenticating %s:%s', name, pass);
    // dummy database
    db.bind('users');
    db.users.find().limit(1).next(function (err, user) {
        // query the db for the given username
        db.close();
        if (err) return fn(err);
        if (!user) return fn(new Error('cannot find user'));
        console.log(user);
        if (user.hash){
            hashc(pass, user.salt, function (err, hash) {
                if (err) return fn(err);
                if (hash == user.hash) return fn(null, user);
                fn(new Error('invalid password'));
            });
        }
        else {
            // when you create a user, generate a salt
            // and hash the password ('foobar' is the pass here)
            hashc(user.password, function (err, salt, hash) {
                if (err) throw err;
                // store the salt & hash in the "db"
                user.salt = salt;
                user.hash = hash;
                //update db
                db.bind('users');
                db.users.save(user);
                // apply the same algorithm to the POSTed password, applying
                // the hash against the pass / salt, if there is a match we
                // found the user
                hashc(pass, user.salt, function (err, hash) {

                    if (err) return fn(err);
                    if (hash == user.hash) return fn(null, user);
                    fn(new Error('invalid password'));
                });
            });
        }
    });
};

function restrict(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.redirect('/login');
    }
};

