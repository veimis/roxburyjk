// Controller module for a team page showing the players of the club

// Dependencies
const cmTeam = require('../lib/team.js');

module.exports = function(pb) {
  // Pencilblue dependencies
  var util = pb.util;
  
  // Create the controller
  function TeamController(){};
  
  // Inherits from base controller: accessors for template service, 
  // localization service, request and response handlers.
  util.inherits(TeamController, pb.BaseController);

  ///////////////////////////////////////////////////////////////////
  // Render team template
  // Render is executed within a domain context and errors thrown 
  //  will result in an error page.
  // cb = callback(result)
  ///////////////////////////////////////////////////////////////////
  TeamController.prototype.render = function(cb) {
    var self = this;
    var cos = new pb.CustomObjectService();
    var ms = new pb.MediaService();
 
    self.getNavigation(function(themeSettings, navigation, accountButtons) {
      self.ts.registerLocal('navigation', new pb.TemplateValue(navigation, false));
      self.ts.registerLocal('account_buttons', new pb.TemplateValue(accountButtons, false));
      
      // Query all teams
      cmTeam.getAll(cos, util, ms, function(err, data) {
        if(util.isError(err)) {
          throw err;
        }

        // Register angular objects for team controller
        var angularData = { 
          teams: data,
        };
        
        // Pre select player if available.
        if(data.length > 0 && data[0].players.length > 0)
        {
          angularData.selected = data[0].players[0];
        }

        // Register angular objects for the template
        var angularObjects = pb.ClientJs.getAngularObjects(angularData);
        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
        
        // Register angular controller for pencilblue navigation
        var ok = self.ts.registerLocal('angular', function(flag, cb) {
          var angularData = pb.ClientJs.getAngularController({}, ['ngSanitize']);
          cb(null, angularData);
        }); 
        
        // Load team template
        self.ts.load('team', function(err, result) {
          if(util.isError(err)) {
            throw err;
          }
          cb({content: result});
        });
      }); 
    });
  };
  
  ///////////////////////////////////////////////////////////////////
  // Register routes
  // Pencilblue will call getRoutes() for each controller in the
  // controllers folder during initialization to regiser handlers
  // for the routes.
  ///////////////////////////////////////////////////////////////////
  TeamController.getRoutes = function(cb) {
    var routes = [
      {
        method: 'get',
        path: '/club-manager/team',
        auth_required: false,
        content_type: 'text/html'
        // handler is not defined, defaults to render()
      }
    ];
    cb(null, routes);
  };
 
  ///////////////////////////////////////////////////////////////////
  // Get navigation
  // Copy from pencilblue/controllers/index.js
  ///////////////////////////////////////////////////////////////////
  TeamController.prototype.getNavigation = function(cb) {
    var options = {
        currUrl: this.req.url,
        session: this.session,
        ls: this.ls,
        activeTheme: this.activeTheme
    };
    
    var menuService = new pb.TopMenuService();
    menuService.getNavItems(options, function(err, navItems) {
      if (util.isError(err)) {
          pb.log.error('Index: %s', err.stack);
      }
      cb(navItems.themeSettings, navItems.navigation, navItems.accountButtons);
    });
  };

  return TeamController;
};

