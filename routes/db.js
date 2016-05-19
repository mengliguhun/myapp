/**
 * Created by Administrator on 2016/5/18.
 */
var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/mydb", {native_parser:true});

module.exports = db;
