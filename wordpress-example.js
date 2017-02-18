var wordpress = require("github.com/quilt/wordpress");
var memcached = require("github.com/quilt/memcached");
var mysql = require("github.com/quilt/mysql");
var haproxy = require("github.com/quilt/haproxy");
var spark = require("github.com/quilt/spark");

var memcd = new memcached.Memcached(3);
var db = new mysql.Mysql(2);
var sprk = new spark.Spark(1, 4); // 1 Master, 4 Workers
var wp = new wordpress.Wordpress(4, db, memcd);
var hap = new haproxy.Haproxy(2, wp.wp);

sprk.workers.connect(7077, db.master);
hap.public();

// Infrastructure
var deployment = createDeployment({});

var nWorker = 4;
var baseMachine = new Machine({
    provider: "Amazon",
    region: "us-west-1",
    size: "m4.large",
    sshKeys: githubKeys("ejj"), // Replace with your GitHub username.
});

deployment.deploy(baseMachine.asMaster())
deployment.deploy(baseMachine.asWorker().replicate(nWorker + 1))
deployment.deploy([memcd, db, sprk, wp, hap]);
