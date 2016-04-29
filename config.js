var config = {};

var env = process.env;
if (env.OPENSHIFT_GEAR_DNS) {
   var useMemory = {
      "use_memory": true,
      "use_cache": false
   };
   var useMemoryAndCache = {
      "use_memory": true,
      "use_cache": true
   };
   // OpenShift config settings
   config = {
      "siteName": "Roxbury JK",
      "siteRoot": "http://" + env.OPENSHIFT_GEAR_DNS,
      "siteIP": env.OPENSHIFT_NODEJS_IP,
      "sitePort": env.OPENSHIFT_NODEJS_PORT,
      "log_level": "info",
      "db": {
         "type": "mongo",
         "servers": [
            env.OPENSHIFT_MONGODB_DB_URL
         ],
         "name": env.OPENSHIFT_APP_NAME,
         "writeConcern": 1
      },
      "settings": useMemory,
      "templates": useMemory,
      "plugins": {
         "caching": useMemory
      }
   };
   if (env.OPENSHIFT_HAPROXY_VERSION) {
      // Scaled application
      config.cluster = {
         "self_managed": false
      };
   }
} else {
   // local dev settings
   config = {
      "siteName": "Roxbury JK local",
      "siteRoot": "http://localhost:8080",
      "siteIP": "0.0.0.0",
      "sitePort": 8080,
      "log_level": "info",
      "db": {
         "type": "mongo",
         "servers": [
            "mongodb://localhost:27017/pencilblue/"
         ],
         "name": "pencilblue",
         "writeConcern": 1
      }
   }

}

module.exports = config;
;
