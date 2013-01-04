require('./lib/env');

var http = require("http"),
    url = require("url"),
    ups = require("./lib/ups"),
    redis = require("redis"),
    qs = require("qs");

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err + " \n" + err.stack);
});

var rtg   = url.parse(process.env.REDISTOGO_URL);
var cache_client = redis.createClient(rtg.port, rtg.hostname);
cache_client.auth(rtg.auth.split(":")[1]);
var port = process.env.PORT || 3000;

http.createServer(function(request, response){
    
  var uri = url.parse(request.url);
  var path = uri.pathname;
  
  request.on('end', function(){
    var query = qs.parse(uri.query);
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.statusCode = 200;

    var json_msg = {callback: query.callback};
    
    if (check_query(query)){
      get_rate(query, function(err, rate){  
        if (err) {
          console.log(err);
          json_msg['error'] = err;
        } else {
          json_msg['rate'] = rate;
        }
        send_json(json_msg, response);
      });
    } else {
      json_msg['error'] = 'Parameters incomplete';
      send_json(json_msg, response);
    }
  });
  
}).listen(port);

console.log("Server running on port " + port);

function send_json(json_msg, response) {
  json_msg = json_msg.callback ? (json_msg.callback + "(" + JSON.stringify(json_msg) + ")") : JSON.stringify(json_msg);
  response.end(json_msg);
}

function check_query(query){
  return (query.origin && query.origin.zip && query.origin.state && query.destination && query.destination.zip && query.destination.state && query.weight) ? true : false;
}

function get_rate(query, callback)  {
  // find the zone 
  var zone = ups.zone(query.origin.zip, query.destination.zip);
  
  if (zone){
    // residential versus commercial
    query.residential = query.residential == 'true' ?  true : false;
    var surcharge = ups.area_surcharge(query.destination.zip, query.residential);
    var address_type = query.residential ? 'residential' : 'commercial';
        
    var key =  zone + ":" + address_type + ":" + query.weight;
    //console.log(key);
    //console.log(surcharge);
    
    // try to get rate from the cache
    cache_client.get(key, function(err, cache_rate){
      if (err) {
        callback("Cache problem! " + err);
      } else {
        if (cache_rate) {
          // if the rate is in the cache, add surcharge and return      
          callback(null, (parseFloat(cache_rate) + surcharge).toString());
        } else {
          // if the rate is not in the cache, get it from ups and put it in the cache
          ups.rate(query, function(err, ups_rate){
            if (err) {
              callback('UPS rating issue: ' + err);
            } else {
              var base_rate = (parseFloat(ups_rate) - surcharge).toString();
              cache_client.setex(key, 86400, base_rate);
              callback(null, ups_rate);
            }
          });
        }
      }
    });
  } else {
    callback("Zone not found");
  }
}