//@COPYRIGHT: Lingxiao Xia
//@AUTHOR: 
//Lingxiao Xia <s1006595991@gmail.com>
//
//@BRIEF: moniter log messages and react to them accordingly
//
//@VERSION: 1.0
//
//@HISTORY:
//1.0: initial version  

"use strict";

var myArgs = process.argv.slice(2);
var pathUtil = require("path");
var info = require(pathUtil.join(__dirname,myArgs[0]));
var bunyan = require("bunyan");
var loggerSetting = {
    "name": (info.name?info.name:"consumer"),
    "streams":[{
        "level":(info.log_level?info.log_level:"info"),
        "path":pathUtil.join(info["log_dir"],(info.name?info.name+".log":"consumer.log"))
    }]
}
if (info.debug){
    loggerSetting.streams.push({
        "level": (info.log_level?info.log_level:"debug"),
        "stream": process.stdout
    })
}
var logger = bunyan.createLogger(loggerSetting);
var topicLoggers = {};

function initTopics(topic, index, array) {
    var loggerSetting = {
        "name": topic.name,
        "streams":[{
            "level": (topic.level?topic.level:"info"),
            "path": pathUtil.join(info["log_dir"],"topic."+topic.name+".log")
        }]
    }
    if (topic.debug){
        loggerSetting.streams.push({
            "level": (topic.level?topic.level:"debug"),
            "stream": process.stdout
        })
    }
    topicLoggers[topic.name] = bunyan.createLogger(loggerSetting);
    topicLoggers[topic.name].info("Start consuming from topic "+topic.name);
}

function run(){
    var module_dir = pathUtil.join(__dirname, info["module_dir"]);
    var moduleList = []
    require("fs").readdirSync(module_dir).forEach(function (module_script){
        if ((!info.exclude_module || info.exclude_module.indexOf(module_script)===-1) && (module_script.indexOf('.js')!=-1)){
            var module = require(pathUtil.join(module_dir,module_script));
            if (!module.name || !module.name.substring){
                module.name = module_script.replace(".js", ""); 
            }
            if (module.debug){
                var streams = [{
                    "level":(module.log_level?module.log_level:"debug"),
                    "path":pathUtil.join(info["log_dir"],"module."+module.name+".log")
                },{
                    "level":(module.log_level?module.log_level:"debug"),
                    "stream": process.stdout
                }]
            } else {
                var streams = [{
                    "level":(module.log_level?module.log_level:"info"),
                    "path":pathUtil.join(info["log_dir"],"module."+module.name+".log")
                }]
            }
            module.logger = bunyan.createLogger({
                "name": module.name,
                "streams": streams
            });
            moduleList.push(module);
        }
    });
    logger.info("Consumer agent initialized successfully");

    var consumerList = []
    if (info["case"]==="baremetal"){
        var Tail = require('tail').Tail;
        var lineSeparator= "\n";
        var fromBeginning = false;
        var watchOptions = {};
        info.topics.forEach(function (topic){
            if (topic.src.substring){
                var consumer = new Tail(pathUtil.join(__dirname,topic.src),lineSeparator,watchOptions,fromBeginning);
                consumer.topic = topic.name;
                consumer.incoming = "line";
                consumer.target = "";
                consumerList.push(consumer);
            } else {
                topic.src.forEach(function (src){
                    var consumer = new Tail(pathUtil.join(__dirname,src),lineSeparator,watchOptions,fromBeginning);
                    consumer.topic = topic.name;
                    consumer.incoming = "line";
                    consumer.target = "";
                    consumerList.push(consumer);
                });
            }
        });
    } else if (info["case"]==="kafka"){
        var kafka = require("kafka-node");
        var HighLevelConsumer = kafka.HighLevelConsumer;
        var clientId = "msgglass_handler_"+JSON.stringify(Math.floor(Math.random()*10001))
        var Client = kafka.Client;
        var client = new Client(info["zookeepers"],clientId);
        var options = info["options"];
        var consumer = new HighLevelConsumer(client, topics, options);
        consumer.incoming = "message";
        consumer.target = "value";
        consumerList.push(consumer);
    } else {
        logger.error(info["case"],"Unknown source type");
        return;
    }
    var topicArray = info["topics"];
    topicArray.forEach(initTopics);
    consumerList.forEach(function (consumer){
        consumer.on(consumer.incoming, function (message){
            var current_topic = (consumer.topic ? consumer.topic : message.topic)
            var message_target=(consumer.target ? JSON.parse(message[consumer.target]) : JSON.parse(message))
            moduleList.forEach(function (module){
                if(module.trigger(message_target)){
                    logger.debug({message:message_target}, module.name.toUpperCase()+" is triggered by message");
                    module.run(message_target,info,module.logger).then(function (response){
                        logger.debug({message:message_target}, module.name.toUpperCase()+" successfully processed message");
                    },function (err){
                        if (err.input && err.message){
                            logger.error({message:err.input,error:err.message}, module.name.toUpperCase()+" encountered error");
                        } else {
                            logger.error({message:message_target,error:err.message}, module.name.toUpperCase()+" encountered error");
                        }
                    });
                }
            });
            topicLoggers[current_topic].debug({message:message_target},"Pulled new message from "+current_topic.toUpperCase());
        });
        consumer.on("error", function (err) {
            logger.error(err);
        });
    });
}

//Delay the start of the program to give logstash enough time to start
setTimeout(run, 10000);