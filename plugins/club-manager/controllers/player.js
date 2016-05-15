// Controller module for a team page showing the players of the club

// Dependencies
const async = require('async');
const cmUtils = require('../lib/club_manager_utils.js');
const cmPlayer = require('../lib/player.js');
const cmStatistics = require('../lib/match_statistics.js');

module.exports = function(pb) {
  // Pencilblue dependencies
  var util = pb.util;
  
  // Create the controller
  function PlayerController(){};
  
  // Inherits from base controller: accessors for template service, 
  // localization service, request and response handlers.
  util.inherits(PlayerController, pb.BaseController);

  ///////////////////////////////////////////////////////////////////
  //
  // Render player template
  // Render is executed within a domain context and errors thrown 
  //  will result in an error page.
  // cb = callback(result)
  //
  ///////////////////////////////////////////////////////////////////
  PlayerController.prototype.render = function(cb) {
    const self = this;
    var cos = new pb.CustomObjectService();
    var ms = new pb.MediaService();
    
    async.waterfall([
      // TODO: If a player is not found by name, show user that nothing was found with given player name.
      async.apply(cmPlayer.findByName, self.query.name, cos, util, ms),
      function(player, callback) {
        cmStatistics.loadPlayerTotals(player._id, new pb.DAO(), util, function(err, stats) {
        callback(err, player, stats);
        });
      },
      function(player, stats, callback) {
        cmUtils.defaultTemplateValues(pb, self, function(err) {
          player.stats = stats;
          const angularData = {
            player: player
          };

          // Register angular objects for the template
          var angularObjects = pb.ClientJs.getAngularObjects(angularData);
          self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
          
          // Register angular controller for pencilblue navigation
          var ok = self.ts.registerLocal('angular', function(flag, cb) {
            var angularData = pb.ClientJs.getAngularController({}, ['ngSanitize']);
            cb(null, angularData);
          });

          callback(null);
        }); 
      },
      function(callback) {
        self.ts.load('player', callback);
      }
    ], 
    function(err, result) {
      if(util.isError(err)) {
        throw err;
      }
      cb({content: result});
    });
  };

  ///////////////////////////////////////////////////////////////////
  // Register routes
  //
  // Pencilblue will call getRoutes() for each controller in the
  // controllers folder during initialization to regiser handlers
  // for the routes.
  //
  ///////////////////////////////////////////////////////////////////
  PlayerController.getRoutes = function(cb) {
    var routes = [
      {
        method: 'get',
        path: '/club-manager/player/',
        auth_required: false,
        content_type: 'text/html'
        // handler is not defined, defaults to render()
      }
    ];

    cb(null, routes);
  };

 return PlayerController;
};
