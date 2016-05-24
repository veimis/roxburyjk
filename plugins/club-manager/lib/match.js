// Exports club manager match module

// Dependencies
var async = require('async');
var cmUtils = require('./club_manager_utils.js');

function Match(){}
var dbName = 'cm_match';

// Add custom object type
// cos = pencilblue custom object service
// util = pencilblue utilities
// cb = callback(error, boolean)
Match.install = function(cos, util, cb) {
	// Custom object fields
	var matchReport = {
		name: dbName,
		fields: {
			title: { field_type: 'text' },
			date: { field_type: 'date' },
      homeGame: {field_type: 'boolean' },
			season: { field_type: 'peer_object', object_type: 'custom:cm_season' },
			description: { field_type: 'wysiwyg' },
			players: { field_type: 'child_objects', object_type: 'custom:cm_player' }
		}
	};

	return cmUtils.createCustomObjectType(cos, util, dbName, matchReport, cb);
};

// Clear match objects and remove custom object type
// cos = pencilblue custom object service
// util = pencilblue utilities
// cb = callback(error, boolean)
Match.uninstall = function(cos, util, cb) {
	return cmUtils.removeCustomObjectType(cos, util, dbName, cb);
};

// Query all matches from the database
// cos = pencilblue custom object service
// util = pencilblue utilities
// cb = callback(err, data)
Match.getAll = function(cos, util, cb) {
	var options = {
     selection: ['name', 'title', 'date', 'description', 'players', 'season']
  };
	cmUtils.queryCustomObjects(cos, util, dbName, options, function(err, data) {
    // Fetch all players for each match 
    // So it's a 2-dimensional parallel fetch
    // For each match, fetch children.
    // Replace the old match with the match that includes the child objects.
    // After all queries are complete call the 'master' cb with the data.
    cmUtils.fetchChildren(cos, util, dbName, data, 2, cb);
  });
};

// Query all matches of the given season
// seasonId: Season database ID object
// cos = pencilblue custom object service
// util = pencilblue utilities
// cb = callback(err, data)
Match.loadBySeason = function(seasonId, cos, util, cb) {
  var options = {
    where: {season: seasonId.toString()}
  };

  cmUtils.queryCustomObjects(cos, util, dbName, options, function(err, matches) {
    cmUtils.fetchChildren(cos, util, dbName, matches, 1, cb);
  });
}

// Query Match by name. Custom object name field is unique.
// title:  Match title 
// cos: pencilblue custom object service instance
// util: pencilblue utilites
// cb = callback(error, data)
// data:  {match, season, players}
Match.loadByName = function(title, cos, util, cb) {
  var options = {
    where: {title: title}
  };
  
  cmUtils.queryCustomObjects(cos, util, dbName, options, function(err, match){
    cmUtils.fetchChildren(cos, util, dbName, match, 1, cb);
  });
};

module.exports = Match;
