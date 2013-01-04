var fs = require('fs');
var path = require('path');

// load the env variables
var envPath = __dirname + '/../config/env.json';
if (fs.existsSync(envPath)) {
  var envConfig = require(envPath);
  Object.keys(envConfig).forEach(function(key){
    process.env[key] = envConfig[key];
  });
}

// Colors
var CLEAR   = "\033[0m";
var BOLD    = "\033[1m";
var BLACK   = "\033[30m";
var RED     = "\033[31m";
var GREEN   = "\033[32m";
var YELLOW  = "\033[33m";
var BLUE    = "\033[34m";
var MAGENTA = "\033[35m";
var CYAN    = "\033[36m";
var WHITE   = "\033[37m";

var matchers = [
  ['redistogo.com', YELLOW, 'Redis'],
  ['ups.com', RED, 'UPS'],
  ['heroku.com', CYAN, 'Heroku'],
  ['', WHITE, 'UNKNOWN']
];

function instrument(mod) {
  var original = mod.request;
  mod.request = function(options, callback) {
    var host = options.host || options.hostname;
    for (var i = 0; i < matchers.length; i++) {
      var matcher = matchers[i];
      if (host.indexOf(matcher[0]) >= 0) break;
    }
    console.log(BOLD + matcher[1] + matcher[2] + CLEAR, options.method, options.path);
    return original(options, callback);
  }
}

instrument(require('http'));
instrument(require('https'));