// Exports match statistics module

const async = require('async');

function MatchStatistics(){}
var dbName = "cm_match_statistics";

// Create collection for match statistics in database.
// _id
// type: goal/assist/booking
// match: match reference
// goal:
//  time: time of the event
//  player: player reference
//  team: home/away
// assist:
//  player: player reference
//  goal: match event reference
// booking:
//  time: time of the event
//  player: player reference
//  card: red/yellow
MatchStatistics.install = function(dao, util, cb) {
  dao.createEntity(dbName, {}, cb);
}

// Drop match statistics collection from database.
// dao = pencilblue data access object
// util = pencilblue utilities
// cb = callback(error, boolean)
MatchStatistics.uninstall = function (dao, util, cb) {
  dao.getDb(function(err, db) {
    if(util.isError(err)) {
      cb(err);
    }

    db.dropCollection(dbName, cb);
  });
};

// Save new statistics to persist database.
// data:  Object to persist.
// dao = pencilblue data access object
// util =  pencilblue utilities
// cb = callback(
MatchStatistics.save = function(data, dao, util, cb) {
  data.object_type = dbName;
  dao.save(data, cb);
};

// Delete match statistics from database
// statId: Database ID of the statistic
// type: statistics type
// dao = pencilblue data access object
// util = pencilblue utilities
// cb = callback(error, number of records deleted)
MatchStatistics.delete = function(statId, type, dao, util, cb) {
  dao.deleteById(statId, dbName, function(err, result) {
    // Delete related assists in case of a goal
    if(type === "goal" && !util.isError(err)) {
      dao.delete({goalId: statId}, dbName, function(err, assistResult) {
        cb(err, assistResult);
      });
    }
    else
    {
      cb(err, result);
    }
  });
};

// Query match statistics for a match
// matchID: Match object database ID.
// dao = pencilblue data access object
// util = pencilblue utilities
// cb = callback(error, data)
MatchStatistics.loadByMatch = function(matchId, dao, util, cb) {
  const opts = {
    where: {matchId: matchId.toString()}
  };
  dao.q(dbName, opts, cb);
};

// Query statistics for a player
// playerId: Player object database ID.
// dao = pencilblue data access object
// util = pencilblue utilities
// cb = callback(error, data)
MatchStatistics.loadByPlayer = function(playerId, dao, util, cb) {
  const opts = {
    where: {playerId: playerId.toString()}
  };
  dao.q(dbName, opts, cb);
};

// Query statistics aggregates
// playerId: Player object database ID.
// dao = pencilblue data access object
// util = pencilblue utilities
// cb = callback(error, data)
//      data = {goals, assists, warnings, penalties}
MatchStatistics.loadPlayerTotals = function(playerId, dao, util, cb) {
  const countQuery = function(type, callback) {
    const where = {
      playerId: playerId.toString(),
      type: type 
    };
    dao.count(dbName, where, callback);   
  };

  async.parallel({
    goals: async.apply(countQuery, "goal"),
    assists: async.apply(countQuery, "assist"),
    warnings: async.apply(countQuery, "warning"),
    penalties: async.apply(countQuery, "penalty")
  }, cb);
};

module.exports = MatchStatistics;


