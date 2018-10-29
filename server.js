var server = require('./config/initializers/app');
var async = require('async');
var logger = require('./utils/log/logger');

logger.info('[Server] Starting ' + process.env.SERVICE_NAME + ' initialization');

async.series([
        server,
    ], function(err) {
        if (err) {
            logger.error(process.env.SERVICE_NAME + ' initialization FAILED', err);
        } else {
            logger.info(process.env.SERVICE_NAME + ' initialized SUCCESSFULLY');
        }
    }
);