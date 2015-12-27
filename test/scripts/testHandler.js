//@COPYRIGHT: Lingxiao Xia
//@AUTHOR: 
//Lingxiao Xia <s1006595991@gmail.com>
//
//@BRIEF: example handler
//
//@VERSION: 1.0
//
//@HISTORY:
//1.0: initial version  

var Promise = require('promise');

function ModuleError(input,reason) {
    this.name = 'ModuleError';
    this.message = reason || 'ModuleError encountered';
    this.input = input
    this.stack = (new Error()).stack;
}
ModuleError.prototype = Object.create(Error.prototype);
ModuleError.prototype.constructor = ModuleError;

module.exports = {
    trigger: function(message){
        if (message.msg==="Target message"){
            return true;
        }
        return false;
    },
    run: function(message, config, logger){
        logger.debug({"message":message},"Target message received");
        return new Promise(function(resolve, reject){
            if (!message.value){
                reject(new ModuleError(message,"Message does not have a value field"))
            } else if (message.value>=0){
                reject(new ModuleError(message,"Message has a positive value field"))
            } else {
                resolve()
            }
        });
    },
    debug:true
}



