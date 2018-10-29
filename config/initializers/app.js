/**
 * Module dependencies.
 */
var express = require('express');
var bodyParser = require('body-parser');

var path = require('path');
var logger = require('../../utils/log/logger');
var exphbs = require('express-handlebars');

/**
 * Create Express server.
 */
var app = express();

/**
 * Express configuration.
 */
var start =  function(callback) {
    "use strict";
    app.listen(process.env.PORT || 3000);

    logger.info(process.env.SERVICE_NAME + ' HTTP Server Listening on Port ' + (process.env.PORT || 3000));

    logger.info(process.env.SERVICE_NAME + ' Initializing view engine');

    app.engine('handlebars', exphbs({
        defaultLayout: 'main',
        layoutsDir:'views/layouts',
        partialsDir:'views/partials',
        helpers: {
            __: function() { return i18n.__.apply(this, arguments); },
            __n: function() { return i18n.__n.apply(this, arguments); },
            compare: function(lvalue, rvalue, options) {

                if (arguments.length < 3)
                    throw new Error("Handlerbars Helper 'compare' needs 2 parameters");

                var operator = options.hash.operator || "==";

                var operators = {
                    '==':       function(l,r) { return l == r; },
                    '===':      function(l,r) { return l === r; },
                    '!=':       function(l,r) { return l != r; },
                    '<':        function(l,r) { return l < r; },
                    '>':        function(l,r) { return l > r; },
                    '<=':       function(l,r) { return l <= r; },
                    '>=':       function(l,r) { return l >= r; },
                    'typeof':   function(l,r) { return typeof l == r; },
                    'includes': function(l,r) { return l.includes(r.toString()); },
                    '+':        function(l,r) { return l + r; }
                };

                if (!operators[operator])
                    throw new Error("Handlerbars Helper 'compare' doesn't know the operator "+operator);

                var result = operators[operator](lvalue,rvalue);

                if( result ) {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }
            },
            addOne: function(num) {
                return num + 1;
            }
        }
    }));

    app.set('views', path.join(__dirname, '../../views'));
    app.set('view engine', 'handlebars');
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    
    app.use(express.static(path.join(__dirname, '../../public'), { maxAge: 31557600000 }));
    
    logger.info(process.env.SERVICE_NAME + ' Initializing routes');

    // Introduce routes
    require('../../routes/index')(app, logger);

    // Error handler
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: (app.get('env') === 'development' ? err : {})
        });

        logger.error(process.env.SERVICE_NAME + ' 500 Error: Internal Server Error');
        next(err);
    });

    if (callback) {
        return callback();
    }
};

module.exports = start;