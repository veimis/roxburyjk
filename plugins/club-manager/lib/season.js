// Exports club manager season module

// Dependencies
var async = require('async');
var cmUtils = require('./club_manager_utils.js');

function Season(){}
var dbName = 'cm_season';

// Add new custom object type
// cos = pencilblue custom object service
// util =  pencilblue utilities
// cb = callback(error, boolean)
Season.install = function(cos, util, cb) {
	// Custom object fields
	var season = {
		name: dbName,
		fields: {
			name: { field_type: 'text' },
      startDate: { field_type: 'date' },
      endDate: { field_type: 'date' },
			description: { field_type: 'wysiwyg' },
			team: { field_type: 'peer_object', object_type: 'custom:cm_team' }
		}
	};

	return cmUtils.createCustomObjectType(cos, util, dbName, season, cb);
};

// Query Season by name. Custom object name field is unique.
// name: Season name
// cos: pencilblue custom object service instance.
// util: pencilblue utilites
// cb = callback(error, season)
Season.loadByName = function(name, cos, util, cb) {
  cmUtils.getCustomObjectTypeId(cos, util, dbName, function(err, typeId) {
    if(util.isError(err)) {
      cb(err, null);
    }
    cos.loadByName(typeId.toString(), name, function(err, season) {
      if(util.isError(err)) {
        cb(err, null);
      }

      cb(err, season);
    });
  });
};

// Clear season objects and remove custom object type
// cos = pencilblue custom object service
// util = pencilblue utilities
// cb = callback(error, boolean)
Season.uninstall = function(cos, util, cb) {
	return cmUtils.removeCustomObjectType(cos, util, dbName, cb); 
};

// Get season objects by team reference.
// cos = pencilblue custom object service
// util = pencilblue utilities
// teamId: Team database identifier
// cb = callback(error, results)
Season.getByTeam = function(cos, util, teamId, cb) {
  const opts = {
    where: { team: teamId }
  };

  cmUtils.queryCustomObjects(cos, util, dbName, opts, cb);
};

module.exports = Season;
