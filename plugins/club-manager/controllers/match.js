// Controller module for the match 

// Dependencies
const cmUtils = require('../lib/club_manager_utils.js');
const cmMatch = require('../lib/match.js');
const cmMatchStats = require('../lib/match_statistics.js');
const cmTeam = require('../lib/team.js');
const async = require('async');

module.exports = function(pb) {
  // Pencilblue dependencies
  var util = pb.util;
  
  // Create the controller
  function MatchController(){};
  
  // Inherits from base controller: accessors for template service, 
  // localization service, request and response handlers.
  util.inherits(MatchController, pb.BaseController);
 
  // Subnavigation key
  var SUB_NAV_KEY = 'match_index';
  
  //////////////////////////////////////////////////////////////////////
  // Render match view
  // @cb = callback(result)
  //////////////////////////////////////////////////////////////////////
  MatchController.prototype.render= function(cb) {
    var self = this;
    var cos = new pb.CustomObjectService();
    
    async.waterfall([
      function(waterfallCb) {
        cmMatch.loadByName(self.query.name, cos, util, waterfallCb);
      },
      function(matches, waterfallCb) {
        cmMatchStats.loadByMatch(matches[0]._id, new pb.DAO(), util, function(err, stats) {
          var match = matches[0];
          match.stats = stats;
          waterfallCb(err, match);
        });
      },
      function(match, waterfallCb) {
        cmTeam.getById(match.season.team, cos, util, function(error, team) {
          const results = {
            match: match,
            team: team.name
          };

          waterfallCb(error, results);
        });
      }
    ], function(error, results) {
      // Register angular objects for match controller
      var angularObjects = pb.ClientJs.getAngularObjects(results);
      self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));

      cmUtils.defaultTemplateValues(pb, self, function(err) {
        self.ts.load('matchStandAlone', function(err, result) {
          if(util.isError(err)) {
            throw err;
          }

          cb({content: result});
        });
      });
    });
  };

  //////////////////////////////////////////////////////////////////////
  // Setup up routes for this controller.
  // Pencilblue will call getRoutes() for each controller in the
  // controllers during initialization to register handlers for
  // the defined routes.
  //////////////////////////////////////////////////////////////////////
  MatchController.getRoutes = function(cb) {
    var routes = [
      {
        method: 'get',
        path: '/club-manager/match/',
        auth_required: false,
        content_type: 'text/html',
        // handler is not defined, defaults to render()
      }
    ];

    cb(null, routes);
  };

  return MatchController;
};
