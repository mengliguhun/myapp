/**
 * Created by Administrator on 2016/5/18.
 */
var mongo = require('mongoskin');
var dbUri = process.env.MONGO_URI || "mongodb://localhost:27017/mydb";

var db = mongo.db(dbUri, {native_parser:true});

module.exports = db;
