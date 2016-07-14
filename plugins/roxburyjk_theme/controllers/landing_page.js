// Controller for the landing page

module.exports = function(pb) {
  
  // Pencilblue dependencies
  const util = pb.util;

  // Extend pencilblue base controller
  const LandingPage = function(){};
  util.inherits(LandingPage, pb.BaseController);

  // Define routes handled by this controller
  LandingPage.getRoutes = function(cb) {
    const routes = [{
      method: 'get',
      path: "/",
      auth_required: false,
      content_type: 'text/html'
      // Handler defaults to render() if not defined.
    }];

    cb(null, routes);
  };

  // Render template
  LandingPage.prototype.render = function(cb) {
    const reply = {
      content_type: 'text/html',
      code: 200
    };

    // Register angular controller for pencilblue navigation
    var ok = this.ts.registerLocal('angular', function(flag, cb) {
      var angularData = pb.ClientJs.getAngularController({}, ['ngSanitize']);
      cb(null, angularData);
    });

    this.ts.load('landing_page', function(error, result) {
      reply.content = result;
      cb(reply);
    });
  };

  // Export
  return LandingPage;
};
