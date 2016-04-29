// Controller module for the match 

// Dependencies
var cmUtils = require('../lib/club_manager_utils.js');
var cmMatch = require('../lib/match.js');
var cmMatchStats = require('../lib/match_statistics.js');

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
    
    // Query data
    cmMatch.loadByName(self.query.name, cos, util, function(err, data) {
      cmMatchStats.loadByMatch(data[0]._id, new pb.DAO(), util, function(err, stats) {
        // Register angular objects for match controller
        var angularData = {
          match: data[0],
        };
        angularData.match.stats = stats;

        var angularObjects = pb.ClientJs.getAngularObjects(angularData);
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
