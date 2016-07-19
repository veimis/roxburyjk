// Exports club manager team module

// Dependencies
var async = require('async');
var cmUtils = require('./club_manager_utils.js');

function Team(){}
var dbName = 'cm_team';

// Add new custom object type
// cos = pencilblue custom object service
// util =  pencilblue utilities
// cb = callback(error, boolean)
Team.install = function(cos, util, cb) {
	// Custom object fields
	var team = {
		name: dbName,
		fields: {
			name: { field_type: 'text' },
			description: { field_type: 'wysiwyg' },
			players: { field_type: 'child_objects', object_type: 'custom:cm_player' }
		}
	};

	return cmUtils.createCustomObjectType(cos, util, dbName, team, cb);
};

// Clear team objects and remove custom object type
// cos = pencilblue custom object service
// util = pencilblue utilities
// cb = callback(error, boolean)
Team.uninstall = function(cos, util, cb) {
	return cmUtils.removeCustomObjectType(cos, util, dbName, cb); 
};

// Get team database identifier
// cos = pencilblue custom object service
// util = pencilblue utilities
// teamName: Name of the team
// cb = callback(error, result)
Team.getId = function(cos, util, teamName, cb) {
  const options = {
    select: { '_id': true },
    where: { name: teamName } 
  };

  cmUtils.queryCustomObjects(cos, util, dbName, options, function(err, result) {
    cb(null, result[0]._id);
  });
}

// Query all player objecst from the database.
// teamName: Name of the team, if null: get all teams.
// cos = pencilblue custom object service
// util = pencilblue utitilities
// ms = pencilblue media service
// cb = callback(err, data)
Team.getAll = function(teamName, cos, util, ms, cb) {
  const options = {
    select: {'name': true, 'players': true}
  };

  if(!util.isNullOrUndefined(teamName)) {
    options.where = {'name': teamName};
  }

	cmUtils.queryCustomObjects(cos, util, dbName, options, function(err, data) {
    // Get team custom object type id and fetch children (players) for each team
    cmUtils.getCustomObjectTypeId(cos, util, dbName, function(err, typeId) {
      async.each(data, function(team, cb) {
        // Set fetch depth to 2: Includes player images (media objects).
        var options = { fetch_depth: 2 };
        cos.fetchChildren(team, options, typeId.toString(), function(err, object) {
          // If found, the team is overwritten with 
          // the object that includes the child objects.

          // Remove personal details from results
          for(var i = 0; i < team.players.length; ++i) {
            delete team.players[i].email;
            delete team.players[i].contactNumber;
          }

          cb(err);
        }); 
      }, function(err) {
        cb(err, data);
      });
    });
  });
};

// Get team by team database id
// teamId: Team database identifier
// cos = pencilblue custom object service
// util = pencilblue utilities
// cb = callback(error, data)
Team.getById = function(teamId, cos, util, cb) {
  cos.loadById(teamId, cb);
};
      
module.exports = Team;
