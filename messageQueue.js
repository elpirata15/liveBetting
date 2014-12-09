var iron_mq = require('iron_mq');
var serversMq = new iron_mq.Client({token: process.env.IRON_MQ_TOKEN, project_id: process.env.IRON_MQ_PROJECT_ID, queue_name: "server_msg"});
var gamesMq = new iron_mq.Client({token: process.env.IRON_MQ_TOKEN, project_id: process.env.IRON_MQ_PROJECT_ID, queue_name: "games_msg"});
var bidsMq = new iron_mq.Client({token: process.env.IRON_MQ_TOKEN, project_id: process.env.IRON_MQ_PROJECT_ID, queue_name: "bids_msg"});
var requestsMq = new iron_mq.Client({token: process.env.IRON_MQ_TOKEN, project_id: process.env.IRON_MQ_PROJECT_ID, queue_name: "requests_msg"});
