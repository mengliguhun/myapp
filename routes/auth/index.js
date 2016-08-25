/**
 * Module dependencies.
 */
var express = require('express');
var hashc = require('./pass').hash;
var router = express.Router();
var dbPool = require('../db');
module.exports = router;

// Session-persisted message middleware
router.use(function (req, res, next) {
    var err = req.session.error;
    var msg = req.session.success;

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
router.post('/register', function (req, res) {
    register(req.body.username, req.body.password,req.body.passwordtwo,function (err, user) {
        if (user) {
            // Regenerate session when signing in
            // to prevent fixation
            req.session.regenerate(function () {
                // Store the user's primary key
                // in the session store to be retrieved,
                // or in this case the entire user object
                req.session.user = user;
                req.session.success = '注册成功';
                res.redirect('/');
            });
        } else {
            req.session.error = err.toString();
            res.redirect('/register');
        }
    });
});
router.get('/login', function (req, res) {
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
                req.session.success = '登录成功.';
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
    dbPool.acquire(function(err,db){
        if (err){
            return fn(err);
        }
        else {
            db.bind('users');
            db.users.find({name:name}).limit(1).next(function (err, item) {
                // query the db for the given username
                dbPool.release(db);
                if (err){
                    return fn(err);
                }
                if (item){
                    return fn(new Error('昵称已存在'));
                }
                if(pass && pass1){
                    if (pass == pass1){
                        var user={};
                        user.name = name;
                        user.password = pass;

                        hashc(pass, function (err, salt, hash) {
                            if (err) throw err;
                            // store the salt & hash in the "db"
                            user.salt = salt;
                            user.hash = hash;
                            //update db
                            dbPool.acquire(function(err,db) {
                                if (err) {
                                    return fn(err);
                                }
                                else {
                                    db.bind('users');
                                    db.users.save(user,function (err,result) {
                                        dbPool.release(db);
                                        if (err) return fn(err);
                                        if (result) return fn(null, result);

                                    });
                                }
                            });
                        });
                    }
                    else {
                        return fn(new Error('密码不一致'));
                    }
                }
                else {
                    return fn(new Error('密码不一致'));
                }
            });
        }
    });

}

// Authenticate using our plain-object database of doom!
function authenticate(name, pass, fn) {
    if (!module.parent) console.log('authenticating %s:%s', name, pass);
    if (!name || !pass){
        return fn(new Error('用户名和密码不能为空'));
    }
    // dummy database
    dbPool.acquire(function(err,db){
        if (err){
            return fn(err);
        }
        else {
            db.bind('users');
            db.users.find({name:name,password:pass}).limit(1).next(function (err, user) {
                // query the db for the given username
                dbPool.release(db);
                if (err) return fn(err);
                if (!user) return fn(new Error('cannot find user'));

                if (user.hash){
                    hashc(pass, user.salt, function (err, hash) {
                        if (err) return fn(err);
                        if (hash == user.hash) return fn(null, user);
                        fn(new Error('invalid password'));
                    });
                }
                else {
                    fn(new Error('invalid password'));
                }
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

