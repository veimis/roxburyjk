// Controller module for a players page showing the players of the club

// Dependencies
const cmTeam = require('../lib/team.js');

module.exports = function(pb) {
  // Pencilblue dependencies
  var util = pb.util;
  
  // Create the controller
  function PlayersController(){};
  
  // Inherits from base controller: accessors for template service, 
  // localization service, request and response handlers.
  util.inherits(PlayersController, pb.BaseController);

  ///////////////////////////////////////////////////////////////////
  // Register routes
  // Pencilblue will call getRoutes() for each controller in the
  // controllers folder during initialization to regiser handlers
  // for the routes.
  ///////////////////////////////////////////////////////////////////
  PlayersController.getRoutes = function(cb) {
    var routes = [
      {
        method: 'get',
        path: '/club-manager/players',
        auth_required: false,
        content_type: 'text/html'
        // handler is not defined, defaults to render()
      }
    ];
    cb(null, routes);
  };

  ///////////////////////////////////////////////////////////////////
  // Render team template
  // Render is executed within a domain context and errors thrown 
  //  will result in an error page.
  // cb = callback(result)
  ///////////////////////////////////////////////////////////////////
  PlayersController.prototype.render = function(cb) {
    var self = this;
    var cos = new pb.CustomObjectService();
    var ms = new pb.MediaService();
 
    self.getNavigation(function(themeSettings, navigation, accountButtons) {
      self.ts.registerLocal('navigation', new pb.TemplateValue(navigation, false));
      self.ts.registerLocal('account_buttons', new pb.TemplateValue(accountButtons, false));
      
      // Query all teams
      cmTeam.getAll(self.query.team, cos, util, ms, function(err, data) {
        if(util.isError(err)) {
          throw err;
        }

        // Register angular objects for team controller
        var angularData = { 
          teams: data,
        };
        
        // Pre select player if available.
        self.preSelectPlayer(data, angularData, self.query.player);

        // Register angular objects for the template
        var angularObjects = pb.ClientJs.getAngularObjects(angularData);
        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
        
        // Register angular controller for pencilblue navigation
        var ok = self.ts.registerLocal('angular', function(flag, cb) {
          var angularData = pb.ClientJs.getAngularController({}, ['ngSanitize']);
          cb(null, angularData);
        }); 
        
        // Load team template
        self.ts.load('players', function(err, result) {
          if(util.isError(err)) {
            throw err;
          }
          cb({content: result});
        });
      }); 
    });
  };
  
  ///////////////////////////////////////////////////////////////////
  //
  // See if a player can be preslected.
  // teams: Array of teams that will be shown.
  // angularData: Data object that will be given to angularjs scope.
  // playerName: Player name from query parameter.
  //
  ///////////////////////////////////////////////////////////////////
  PlayersController.prototype.preSelectPlayer = function(teams, angularData, playerName) {
    // Preselect player by query parameter
    if(playerName !== undefined) {
      for(var i = 0; i < teams.length; ++i) { 
        // Can't use array.find(func) since openshift server has 
        // node version 0.10.x which does not implement it.
        //const selected = teams[i].players.find(findPlayer, playerName);

        var selected = undefined;
        for(var j = 0; j < teams[i].players.length; ++j) {
          if(teams[i].players[j].name === playerName) {
            selected = teams[i].players[j];
            break;
          }
        }

        if(selected !== undefined) {
          angularData.selected = selected;
          break;
        }
      }
    }

    // Preselected first player in the first team
    if(angularData.selected === undefined &&
      teams.length > 0 
      && teams[0].players.length > 0)
    {
      angularData.selected = teams[0].players[0];
    }
  };

  ///////////////////////////////////////////////////////////////////
  // 
  // Compare function to find the correct player.
  // Compare the names of the players.
  //
  ///////////////////////////////////////////////////////////////////
  function findPlayer(player) {
    return player.name === String(this);
  };

  ///////////////////////////////////////////////////////////////////
  // Get navigation
  // Copy from pencilblue/controllers/index.js
  ///////////////////////////////////////////////////////////////////
  PlayersController.prototype.getNavigation = function(cb) {
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

  return PlayersController;
};

