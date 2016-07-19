// Export utilities module

// Dependencies
var async = require('async');

function clubManagerUtils(){}

// Add new custom object type
// cos = pencilblue custom object service
// util = pencilblue utilities
// objectName: Custom object database name
// objectFields: Custom object fields 
// cb = callback(error, boolean)
clubManagerUtils.createCustomObjectType = function(	cos, util, objectName, 
																										objectFields, cb) {
	// Check if custom type already exists.
	cos.loadTypeByName(objectName, function(err, objectType) {
		if(util.isError(err)) {
			return cb(err, false);
		}
		else if(!util.isNullOrUndefined(objectType)) {
			return cb(new Error(objectName + ' object already exists.'), false);
		}

		// Create new custom object type
		cos.saveType(objectFields, function(err, result) {
			return cb(err, !util.isError(err));
		});
	});
};

// Clear custom objects from database and remove custom object type
// cos = pencilblue custom object service
// util = pencilblue utilities
// objectName: Custom object database name
// cb = callback(error, boolean)
clubManagerUtils.removeCustomObjectType = function(cos, util, objectName, cb) {
	// Get object type
	cos.loadTypeByName(objectName, function(err, objectType) {
		// If object does not exists there is nothing to do.
		// Return error if there was any.
		if(util.isNullOrUndefined(objectType) || util.isError(err)) {
			return cb(err, !util.isError(err));
		}
	
		// Clear custom objects from database, then delete custom object type
		async.series([
			function deleteCustomObjects(cb) {
				cos.deleteForType(objectType, function(err, result) {
					return cb(err);
				});
			},
			function deleteCustomObjectType(cb) {
				cos.deleteTypeById(objectType._id.toString(), function(err) {
					return cb(err);
				});
			}], cb
		);
	});
};

// Query all custom objects of given type from database.
// cos = pencilblue custom object service
// util = pencilblue utilities
// objectName: Custom ojbject database name
// options: Query options, see http://pencilblue.github.io/classes/DAO.html#method_q
// cb = callback(error, data)
clubManagerUtils.queryCustomObjects = function(	cos, util, objectName, 
																								options, cb) {
  var self = this;

	// Get custom object type id and use it to find all custom objects,
	// finally call cb
	async.waterfall([
		function getCustomObjectTypeId(cb) {
      self.getCustomObjectTypeId(cos, util, objectName, cb);   
		},
		function getCustomObjects(typeId, cb) {
			cos.findByType(	typeId.toString(), options, 
        function(err, results) {
          cb(err, results);
			});
		}], cb
	);
};

// Fetch children for given objects.
// cos = pencilblue custom object service
// util = pencilblue utilities
// dbName: Custom object database name
// objects: Collection of objects
// depth: How many nested children are fetched.
// cb = callback(error, data)
clubManagerUtils.fetchChildren = function(cos, util, dbName, objects, depth, cb) {
  this.getCustomObjectTypeId(cos, util, dbName, function(err, typeId) {
    async.each(objects, function(object, cb) {
      // Set fetch depth, how many child objects are fetched. 
      var options = { fetch_depth: depth};
      cos.fetchChildren(object, options, typeId.toString(), function(err, object) {
        // If found, the match is overwritten with 
        // the object that includes the child objects.
        cb(err);
      }); 
    }, function(err) {
      cb(err, objects);
    });
  });
};

// Get custom object type id from custom object type name
// cos = pencilblue custom object service
// util = pencilblue utilities
// objectName: Custom object type name
// cb = callback(error, typeId)
clubManagerUtils.getCustomObjectTypeId = function(cos, util, objectName, cb) {
  cos.loadTypeByName(objectName, function(err, objectType) {
    if(util.isError(err) || util.isNullOrUndefined(objectType)) {
      return cb(err, null);
    }
      
    return cb(err, objectType._id);
  });
};

// Get required template values for the default pencilblue theme: 
//  navigation, account_buttons and angular
// Modified from pencilblue/controllers/index.js
// @pb = pencilblue object
// @controller: Controller to which default template values are attached.
// cb = callback(error)
clubManagerUtils.defaultTemplateValues = function(pb, controller, cb) {
  var options = {
      currUrl: controller.req.url,
      session: controller.session,
      ls: controller.ls,
      activeTheme: controller.activeTheme
  };
  
  var menuService = new pb.TopMenuService();
  menuService.getNavItems(options, function(err, navItems) {
    if (pb.util.isError(err)) {
        pb.log.error('Index: %s', err.stack);
    }
    else
    {
      controller.ts.registerLocal('navigation', new pb.TemplateValue(navItems.navigation, false));
      controller.ts.registerLocal('account_buttons', new pb.TemplateValue(navItems.accountButtons, false));
   
      // Register angular controller for pencilblue navigation
      var ok = controller.ts.registerLocal('angular', function(flag, cb) {
        var angularData = pb.ClientJs.getAngularController({}, ['ngSanitize']);
        cb(null, angularData);
      });        
    }
 
    cb(err);
  });
}; 

///////////////////////////////////////////////////////////////////
//
// Get navigation. Navigation is set up in the admin interface.
// Copy from pencilblue/controllers/index.js
// 
// controller: the caller controller: Used for request details.
// pb: pencilblue object
// cb: callback(themeSettings, navigation, accountButtons)
// 
///////////////////////////////////////////////////////////////////
clubManagerUtils.getNavigation = function(controller, pb, cb) {
  var options = {
      currUrl: controller.req.url,
      session: controller.session,
      ls: controller.ls,
      activeTheme: controller.activeTheme
  };
  
  const menuService = new pb.TopMenuService();
  menuService.getNavItems(options, function(err, navItems) {
    if (pb.util.isError(err)) {
        pb.log.error('Index: %s', err.stack);
    }
    cb(navItems.themeSettings, navItems.navigation, navItems.accountButtons);
  });
};

module.exports = clubManagerUtils;
