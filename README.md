Node.js app to get public UPS shipping rates. There are two main advantages to using this app:

1. Faster: rates get cached in Redis so that queries with the same features aren't making a round trip to UPS.
2. Easier: no XML, just JSON

This app is deployed on a free Heroku instance and sample code references that instance. No guarantees are made on the continued availability of that instance. See this [blog post](http://mechanicalbee.com/2011/building-a-small-node-app-on-heroku.html) for some background.

### Getting started
- Get Redis. Free 5MB instances are available from [RedisToGo](https://redistogo.com/).
- Setup [UPS credentials](https://www.ups.com/upsdeveloperkit). 
- Make a copy of `config/env.json.example` and `config/ups.json.example`. Change the extension to `.json` and fill in the values.

### How to use: 
[From browser](http://hollow-spring-510.herokuapp.com/?destination[state]=NJ&destination[zip]=07305&origin[state]=NC&origin[zip]=27713&residential=false&weight=4)

Cross-domain Ajax with jQuery:
```javascript
$.ajax({
  url: "http://hollow-spring-510.herokuapp.com/?destination[state]=NJ&destination[zip]=07305&origin[state]=NC&origin[zip]=27713&residential=false&weight=4",
  dataType: 'jsonp',
  success: function(d){
    console.log(d)
  }
});
```

With Node.js:

```javascript
var http = require("http"),
  qs = require("qs");

var query = qs.stringify({
  origin: { state: 'NC', zip: '27713' },
  destination: {state: 'NY', zip: '10001' },
  weight: '20',
  residential: 'true'
});

var options = {
  host: 'hollow-spring-510.herokuapp.com',
  path: '/?' + query
};

http.get(options, function(res){
  res.setEncoding('utf8');
  res.on('data', function(chunk){
    console.log(chunk);
  });
}).on('error', function(e){
  console.log("Error: " + e.message);
});
```

With Ruby:

```ruby
require 'rest_client'

params = RestClient::Payload.generate(
  :origin => {:state => 'NC', :zip => '27713'},
  :destination => {:state => 'NY', :zip => '11211'},
  :residential => true,
  :weight => 2
)

puts RestClient.get "http://hollow-spring-510.herokuapp.com/?#{params}" 
```

### Negotiated rates: 
Public rates are returned by default. To get negotiated rates from UPS, first you must negotiate rates with UPS. After you are authorized and activated, the rate will be in the xml result under `result.RatedShipment.NegotiatedRates.NetSummaryCharges.GrandTotal.MonetaryValue`.

### Cache expiration: 
Keys expire after 86400 seconds by default.