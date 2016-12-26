/**
 * Created by Administrator on 2016/5/18.
 */
var mongo = require('mongoskin');
var Pool = require('generic-pool').Pool;

var dbPool = new Pool({
    name     : 'mongo',
    create   : function(callback) {
		
        var dbUri = process.env.MONGO_URI || "mongodb://localhost:27017/mydb";
        var db = mongo.db(dbUri, {native_parser:true});
		//console.log('dbUri:', dbUri);
        // parameter order: err, resource
        callback(null, db);
    },
    destroy  : function(db) { db.close(); },
    max      : 10,
    // optional. if you set this, make sure to drain() (see step 3)
    min      : 2,
    // specifies how long a resource can stay idle in pool before being removed
    idleTimeoutMillis : 30000,
    // if true, logs via console.log - can also be a function
    log : true
});
module.exports = dbPool;
