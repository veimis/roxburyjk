// Controller module for a season showing the match reports of the season

// Dependencies
const cmSeason = require('../lib/season.js');
const cmMatch = require('../lib/match.js');
const cmUtils = require('../lib/club_manager_utils.js');
const cmMatchStats = require('../lib/match_statistics.js');
const cmTeam = require('../lib/team.js');
const async = require('async');

module.exports = function(pb) {
	// Pencilblue dependencies
	var util = pb.util;
	var BaseController = pb.BaseController;

	// Create the controller
	function SeasonController(){};

	// Inherits from base controller: accessors for template service,
	// localization service, request and response handlers
	util.inherits(SeasonController, BaseController);

  ///////////////////////////////////////////////////////////////////
	// Register routes.
  // Pencilblue will call getRoutes() for each controller in the
  // controllers folder during initialization to regiser handlers
  // for the routes.
  ///////////////////////////////////////////////////////////////////
	SeasonController.getRoutes = function(cb) {
		var routes = [
			{
				method: 'get',
				path: '/club-manager/season/',
				auth_required: false,
				content_type: 'text/html'
				// handler is not defined, defaults to render()
			}
		];
		cb(null, routes);
	};	
  
  ///////////////////////////////////////////////////////////////////
  // Render season template
	// cb = callback(result)
  ///////////////////////////////////////////////////////////////////
	SeasonController.prototype.render = function(cb) {	
		var self = this;
    
    if(util.isNullOrUndefined(self.query.name)) {
      throw new Error("Season name is not specified in the url query");
    }

		var cos = new pb.CustomObjectService();

    async.waterfall([
      function(cb) {
        cmSeason.loadByName(self.query.name, cos, util, cb);
      },
      function(season, cb) {
        async.parallel({
          matches: function(parallelCb) {
            cmMatch.loadBySeason(season._id, cos, util, parallelCb);
          },
          team: function(parallelCb) {
            cmTeam.getById(season.team, cos, util, parallelCb);
          } 
        }, cb);
      },
      function(results, cb) {
        getStats(self, results.matches, new pb.DAO(), util, function(err, matches) {
          cb(null, results);
        });
      }
    ], function(err, results) {
      renderSeason(self, results, util, cmUtils, cb);
    });
  };

  ///////////////////////////////////////////////////////////////////
  // Get match stats for given matches.
  // controller: This controller
  // matches: Collection of match objects
  // dao: pencilblue data access object
  // util: pencilblue utilities
  // cmUtils: Club manager utilities
  // cb = callback(err, data)
  ///////////////////////////////////////////////////////////////////
  function getStats(controller, matches, dao, util, cb) {
    async.each(matches, function(match, eachCb) {
      cmMatchStats.loadByMatch(match._id, dao, util, function(err, stats) {
        match.stats = stats;
        eachCb();
      });
    }, function(err) {
        cb(err, matches);
    });
  }

  ///////////////////////////////////////////////////////////////////
  // Render given matches using the season template.
  // controller:  This controller, not sure how the scope works here.
  // matches: Matches that will be renderd
  // util:  Pencilblue utilites
  // cmUtils: Club manager utilities
  // cb = callback(result)
  ///////////////////////////////////////////////////////////////////
  function renderSeason(controller, results, util, cmUtils, cb) {
    cmUtils.defaultTemplateValues(pb, controller, function(err) {
      var ok = controller.ts.registerLocal('angular', function(flag, cb){
        var objects = {
          matches: results.matches,
          team: results.team.name
        };

        var angularData = pb.ClientJs.getAngularController(objects, ['ngSanitize']);
        cb(null, angularData);
      });

      if(!ok) {
        throw new Error('Failed to register angular controller');
      }

      controller.ts.load('season', function(err, result) {
        if(util.isError(err)) {
          throw err;
        }
        cb({content: result});
      });
    });
  }
	
  // Return controller
  return SeasonController;
};
