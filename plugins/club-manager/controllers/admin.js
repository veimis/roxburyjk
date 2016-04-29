// Controller module for the club manager settings

// Dependencies
var async = require('async');
var clubAdmin = require('../lib/club_manager_admin.js');

module.exports = function(pb) {
  // Pencilblue dependencies
  var util = pb.util;
  var cos = new pb.CustomObjectService();
  var BaseController = pb.BaseController;
  
  // Create the controller
  function AdminController(){};
  
  // Inherits from base controller: accessors for template service, 
  // localization service, request and response handlers.
  util.inherits(AdminController, BaseController);
  
  // Subnavigation key
  var SUB_NAV_KEY = 'club_manager_index';
  
  ///////////////////////////////////////////////////////////////////
  // Render admin page
  // Render is executed within a domain context and errors thrown 
  // will be handled and result in an error page.
  // cb = callback(result)
  ///////////////////////////////////////////////////////////////////
  AdminController.prototype.render = function(cb) {
    var self = this;

    // Get admin view data
    async.waterfall([
      function(cb) {
        clubAdmin.getAdminData(cos, util, new pb.DAO(), function(err, adminData) {
          cb(err, adminData);
        });
      },
      function(adminData, cb) {
        // Register angular objects for the controller
        var angularObjects = pb.ClientJs.getAngularObjects(adminData);
        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));

        // Register angular controller 
        self.ts.registerLocal('angular', function(flag, cb) {
          var objects = {
            navigation: pb.AdminNavigation.get(self.session, ['dashboard'], self.localizationService), 
            pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls),
            access: self.session.authentication.admin_level,
            tabs: self.getTabs(),
          };
          var angularData = pb.ClientJs.getAngularController(objects, ['ui.bootstrap']);
          cb(null, angularData);
        }); 
        cb(null, adminData);
      }],
    function(err, waterfallResult) {
      self.ts.load('/admin/admin', function(err, result) {
        cb({content: result});
      });
    });
  };
  
  ///////////////////////////////////////////////////////////////////
  // Register routes.
  // Pencilblue will call getRoutes() for each controller in the
  // controllers folder during initialization to regiser handlers
  // for the routes.
  ///////////////////////////////////////////////////////////////////
  AdminController.getRoutes = function(cb) {
    var routes = [
      {
        method: 'get',
        path: '/club-manager/admin',
        auth_required: true,
        content_type: 'text/html',
        // handler is not defined, defaults to render()
      }
    ];

    cb(null, routes);
  }; 

  ///////////////////////////////////////////////////////////////////
  // Return tab definition for the default theme admin view.
  ///////////////////////////////////////////////////////////////////
  AdminController.prototype.getTabs = function() {
    return [
      {
        href: '#teams',
        icon: 'users',
        title: 'Teams'
      },
      {
        href: '#players',
        icon: 'user',
        title: 'Players'
      },
      {
        href: '#seasons',
        icon: 'trophy',
        title: 'Seasons'
      },
      {
        active: 'active',
        href: '#matches',
        icon: 'futbol-o',
        title: 'Matches'
      }
    ];
  };

  ///////////////////////////////////////////////////////////////////
  // Get subnavigation items for the admin view.
  ///////////////////////////////////////////////////////////////////
  AdminController.getSubNavItems = function(key, ls, data) {
    return [
      {
        name: 'manage_club',
        title: 'Manage club',
        icon: 'refresh',
        href: '/club-manager/admin'
      }
    ];
  };

  // Register club manager admin subnavigation
  pb.AdminSubnavService.registerFor(SUB_NAV_KEY, AdminController.getSubNavItems);
 
  return AdminController;
};
