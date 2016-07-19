// Inherit from pb base api controller

const matchStats = require('../../lib/match_statistics.js');
const Ajv = require('ajv');
const fs = require('fs');

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
    const data = this.body;
    const ajv = new Ajv();

    // Get schema
    // TODO: Ajv caches the schema, but we are reading the file everytime
    fs.readFile('plugins/club-manager/schemas/saveStats.json', function(err, schemaBuffer) {
      const schema = JSON.parse(schemaBuffer);
      const valid = ajv.validate(schema, data);
      if(!valid) {
        cb({
          code: 400,
          content: ajv.errors
        });
      }
      else {
        matchStats.save(data, new pb.DAO(), util, function(err, result) {
          // Set response content: Send to the client.
          const response = {
            content: result._id
          };

          cb(response);
        });
      }
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
