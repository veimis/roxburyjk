// Inherit from pb base api controller

const matchStats = require('../../lib/match_statistics.js');

module.exports = function(pb) {
  // Pencilblue dependencies
  const util = pb.util;

  // Create controller
  function MatchApiController(){}

  // Inherit from pencilblue bas API controller
  util.inherits(MatchApiController, pb.BaseApiController);

  ///////////////////////////////////////////////////////////////////
  // Register controller routes 
  // Pencilblue will call getRoutes() for each controller in the
  // controllers folder during initialization to regiser handlers
  // for the routes.
  ///////////////////////////////////////////////////////////////////
  MatchApiController.getRoutes = function(cb) {
    const routes = [
    {
      method: "post",
      path: "/club-manager/api/stats",
      auth_required: true,
      content_type: 'application/json',
      request_body: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'],
      handler: 'saveStats'
    }, {
      method: "post",
      path: "/club-manager/api/deleteStats",
      auth_required: true,
      content_type: 'application/json',
      request_body: ['application/json', 'application/x-www-from-urlencoded', 'multipart/form-data'],
      handler: 'deleteStats'
    }, {
      path: "/club-manager/api/getstats/",
      auth_required: false,
      content_type: 'application/json',
      handler: 'getStats'
    }
    ];

    cb(null, routes);
  };

  ///////////////////////////////////////////////////////////////////
  //
  // Save new statistics
  //
  ///////////////////////////////////////////////////////////////////
  MatchApiController.prototype.saveStats = function(cb) {
    matchStats.save(this.body, new pb.DAO(), util, function(err, result) {
      // Set response content: Send to the client.
      const response = {
        content: result._id
      };

      cb(response);
    });
  };

  ///////////////////////////////////////////////////////////////////
  //
  // Delete statistics
  // 
  ///////////////////////////////////////////////////////////////////
  MatchApiController.prototype.deleteStats = function(cb) {
    matchStats.delete(this.body.id, this.body.type, new pb.DAO(), util, function(err, result) {
      cb({});
    });
  };

  /////////////////////////////////////////////////////////////////////
  //
  // Get statistics for the given player.
  //
  /////////////////////////////////////////////////////////////////////
  MatchApiController.prototype.getStats = function(cb) {
    matchStats.loadPlayerTotals(this.query.player, new pb.DAO(), util, function(err, result) {
      // Set response content: Send to the client.
      const response = {
        content: result
      };

      cb(response);
    });
  };
  
  return MatchApiController;
}
