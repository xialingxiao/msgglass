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

//==================== Main ====================
module.exports = {
	trigger: function(message){
		if (message.msg==="test"){
			return true;
		}
		return false;
	},
    run: function(message, config, logger){
    	logger.debug({"message":message},"Test message received");
    },
    debug:true
}



