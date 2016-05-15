// Exports club manager player module

// Dependencies
var async = require('async');
var cmUtils = require('./club_manager_utils.js');

function Player(){}
const dbName = 'cm_player';
const querySelection = ['name', 'number', 'description', 'profilePicture'];

// Add new custom object type
// cos = pencilblue custom object service
// util =  pencilblue utilities
// cb = callback(error, boolean)
Player.install = function (cos, util, cb) {
	// Custom object fields
	var player = {
		name: dbName,
		fields: {
			name: { field_type: 'text' },
      // There are other symbols for the shirt back than numbers
			number: { field_type: 'text' },
      email: {field_type: 'text'},
      contactNumber: {field_type: 'text'},
			profilePicture: { field_type: 'peer_object', object_type: 'media' },
			description: { field_type: 'wysiwyg' },
      pitchPosition: {field_type: 'text'}
		}
	};

	return cmUtils.createCustomObjectType(cos, util, dbName, player, cb);
};

// Clear player objects and remove custom object type
// cos = pencilblue custom object service
// util = pencilblue utilities
// cb = callback(error, boolean)
Player.uninstall = function (cos, util, cb) {
	return cmUtils.removeCustomObjectType(cos, util, dbName, cb); 
};

// Query all player objecst from the database.
// cos = pencilblue custom object service
// util = pencilblue utitilities
// ms = pencilblue media service
// cb = callback(err, data)
Player.getAll = function (cos, util, ms, cb) {
	cmUtils.queryCustomObjects(cos, util, dbName, querySelection, function(err, data) {
    
    // Fetch profile picture media for each player
    async.each(data, getProfilePicture, function(err) {
      cb(err, data);
    });
  });
};

// Query player by name
// cos = pencilblue custom object service
// util = pencilblue utilities
// ms = pencilblue media service
// cb = callback(err, result)
Player.findByName = function(name, cos, util, ms, cb)
{
  const opts = {
    select: querySelection,
    where: {name: name}
  };
  cmUtils.queryCustomObjects(cos, util, dbName, opts, function(err, players) {
    if(players.length > 0) {
      getProfilePicture(players[0], ms, function(err) {
        cb(err, players[0]);
      });
    } else {
      cb(err, {});
    }
  });
};

function getProfilePicture(player, ms, cb) {
  ms.loadById(player.profilePicture, function(err, result) {
    // Replace media id with the media location.
    // Location is used in the template with ngSrc.
    player.profilePicture = result.location;
    cb(err);
 });
};

module.exports = Player;
