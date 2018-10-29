/**
 * Controllers (route handlers).
 */
var homeController = require('./home');

module.exports = function(app, logger) {
    "use strict";

    /**
     * Primary app routes.
     */
    app.get('/', homeController.home);
    app.post('/buyTicket', homeController.buyTicket);
    app.get('/deploy', homeController.deploy);
    app.get('/draw', homeController.draw);
    app.get('/payout', homeController.payout);
    app.get('/retailer', homeController.retailer);

    // Set 404 response for non-exist api routes
    app.use(function(req, res, next) {
        var err = new Error('Routes Request URL Not Found');
        err.status = 404;
        logger.warn('[SERVER] 404 NOT FOUND: Received request ('+ req.pathname +') can not be found');
        next(err);
    });
};