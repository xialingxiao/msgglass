//@COPYRIGHT: Lingxiao Xia
//@AUTHOR: 
//Lingxiao Xia <s1006595991@gmail.com>
//
//@BRIEF: generate dummy log messages to trigger testHandler
//
//@VERSION: 1.0
//
//@HISTORY:
//1.0: initial version  
"use strict";

var pathUtil = require("path");
var bunyan = require("bunyan");
var loggerSetting = {
    "name": "server-1",
    "streams":[{
        "level":"debug",
        "path":pathUtil.join(__dirname, "src/server-1.log")
    }]
}
var server1Logger = bunyan.createLogger(loggerSetting);
var loggerSetting = {
    "name": "server-2",
    "streams":[{
        "level":"debug",
        "path":pathUtil.join(__dirname, "src/server-2.log")
    }]
}
var server2Logger = bunyan.createLogger(loggerSetting);
var loggerSetting = {
    "name": "audit",
    "streams":[{
        "level":"debug",
        "path":pathUtil.join(__dirname, "src/audit.log")
    }]
}
var auditLogger = bunyan.createLogger(loggerSetting);

function callLogger(logger){
    var value = Math.floor(Math.random()*1001);
    if (value>900 || value < 100){
        logger.info("Generating dummy message");
    } else if (value>600 || value < 400){
        logger.info({"value":value-500}, "Target message");
    } else {
        logger.info("Target message");
    }
    setTimeout(callLogger, Math.floor(Math.random()*10001), logger);
}
callLogger(server1Logger);
callLogger(server2Logger);
callLogger(auditLogger);