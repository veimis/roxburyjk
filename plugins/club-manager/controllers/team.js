// Controller module for a team showing the feed of articles for a team

// Dependencies
const cmTeam = require('../lib/team.js');
const cmSeason = require('../lib/season.js');
const cmMatch = require('../lib/match.js');
const cmMatchStats = require('../lib/match_statistics.js');
const async = require('async');

module.exports = function(pb) {
  const util = pb.util;
  
  // Create the controller
  function TeamController(){};

  // Inherit from base controller: Accessors for template service,
  // localization service, request and response handlers.
  util.inherits(TeamController, pb.BaseController);

  ////////////////////////////////////////////////////////////////////
  // 
  // Pencilblue will call getRoutes() for each controller in the 
  // controllers folder during initialization to register handlers
  // for the routes.
  //
  ////////////////////////////////////////////////////////////////////
  TeamController.getRoutes = function(cb) {
    const routes = [{
      method: 'get',
      path: '/club-manager/',
      auth_required: false,
      content_type: 'text/html'
      // handler is not defined, defaults to render()
    }];

    cb(null, routes);
  };

  ////////////////////////////////////////////////////////////////////
  // 
  // Query data and load team template.
  //
  ////////////////////////////////////////////////////////////////////
  TeamController.prototype.render = function(cb) {
    const self = this;

    if(util.isNullOrUndefined(self.query.team)) {
      throw new Error("Team is not specified in the url query");
    }

    async.parallel({
      articles: function(cb) {
        self.getArticles(cb);
      },
      clubManagerData: function(cb) {
        const cos = new pb.CustomObjectService();
        
        // Get seasons linked to the given team.
        async.waterfall([
          function(waterfallCb) {
            cmTeam.getId(cos, util, self.query.team, waterfallCb);
          },
          function(teamId, waterfallCb) {
            cmSeason.getByTeam(cos, util, teamId.toString(), waterfallCb); 
          },
          function(seasons, waterfallCb) {
            self.getMatches(seasons, cos, waterfallCb);
          }
        ], function(err, data) {
          cb(err, data); // async.parallel callback
        });
      }
    }, function(err, results) {
      self.orderPosts(results.articles, results.clubManagerData.allMatches, function(err, data) {

        // Process data and load template.
        const angularData = {
          team: self.query.team,
          seasons: results.clubManagerData.seasons,
          posts: data
        };

        // Register angular objects for the template
        const angularObjects = pb.ClientJs.getAngularObjects(angularData);
        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
        
        // Register angular controller 
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

  ////////////////////////////////////////////////////////////////////
  //
  // Query latest articles
  // cb = callback(error, data)
  // 
  ////////////////////////////////////////////////////////////////////
  TeamController.prototype.getArticles = function(cb) {
    const options = {
      order: {'publish_date': -1},
      limit: 5
    };
    const articleService = new pb.ArticleServiceV2();
    articleService.getAll(options, cb);
  }

  ////////////////////////////////////////////////////////////////////
  // 
  // Query latest match reports
  // seasons: List of season objects.
  // cos: pencilblue custom object service.
  // cb = callback(error, data)
  // 
  ////////////////////////////////////////////////////////////////////
  TeamController.prototype.getMatches = function(seasons, cos, cb) {
    const results = {
        seasons: seasons,
        allMatches: []
      };

    // Get matches for each season
    async.each(seasons, function(season, taskCallback) {
      cmMatch.loadBySeason(season._id, cos, util, function(err, matches) {
        // If there is no error, get match stats and set results
        if(!util.isError(err)) {
          async.each(matches, function(match, eachCb) {
            cmMatchStats.loadByMatch(match._id, new pb.DAO(), util, function(err, stats) {
              match.stats = stats;
              eachCb();
            });
          }, function(err) {
            // Nodejs is single threaded, only i/o calls to database 
            // are executed in parallel -> no problem handling the results 
            // variable.
            results.allMatches = results.allMatches.concat(matches);
            taskCallback(err);
          });
        }
        else {
          taskCallback(err);
        }
      });
    }, function(error) {
      cb(error, results);
    });
  }

  ////////////////////////////////////////////////////////////////////
  //
  // Get latest 5 posts from articles and match reports.
  // articles: List of article objects
  // matches: List of match report objects.
  // cb = callback(error, data)
  //
  ////////////////////////////////////////////////////////////////////
  TeamController.prototype.orderPosts = function(articles, matches, cb) {
    // Sort matches and articles by date using Schwartzian transform
    // https://en.wikipedia.org/wiki/Schwartzian_transform
    // #1 Compute sort keys
    var posts = [].concat(articles, matches);
    for(var i = 0; i < posts.length; ++i) {
      var post = posts[i];
      // Use create timestamp as sort key. 
      // Currently match report don't have publish_date field.
      posts[i] = [].concat(post.created, post);
    }

    // #2 Sort posts using the computed key
    posts.sort(function(obj1, obj2) {
      // obj2 - obj1 for descending order (instead of obj1 - obj2).
      return obj2[0] - obj1[0];
    });

    // Reduce results to 5
    const RESULT_COUNT = 5;
    if(posts.length > RESULT_COUNT) {
      const results = posts.slice(0, RESULT_COUNT);
      posts = results;
    }

    // #3 Remove the computed key and return sorted array
    for(i = 0; i < posts.length; ++i) {
      posts[i] = posts[i][1];
    }

    cb(null, posts);
  };
  
  return TeamController;
};
