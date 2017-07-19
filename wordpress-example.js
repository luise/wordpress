const {Machine, createDeployment, githubKeys, publicInternet}
  = require('@quilt/quilt');
let wordpress = require('./wordpress.js');
let memcached = require('@quilt/memcached');
let mysql = require('@quilt/mysql');
let haproxy = require('@quilt/haproxy');
let spark = require('@quilt/spark');

let memcd = new memcached.Memcached(3);
let db = new mysql.Mysql(2);
let sprk = new spark.Spark(1, 4); // 1 Master, 4 Workers
let wp = new wordpress.Wordpress(4, db, memcd);
let hap = haproxy.singleServiceLoadBalancer(2, wp.wp);

sprk.workers.connect(7077, db.master);
hap.allowFrom(publicInternet, haproxy.exposedPort);

// Infrastructure
let deployment = createDeployment({});

let nWorker = 4;
let baseMachine = new Machine({
    provider: 'Amazon',
    region: 'us-west-1',
    size: 'm4.large',
    sshKeys: githubKeys('ejj'), // Replace with your GitHub username.
});

deployment.deploy(baseMachine.asMaster());
deployment.deploy(baseMachine.asWorker().replicate(nWorker + 1));
deployment.deploy([memcd, db, sprk, wp, hap]);
