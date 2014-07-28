var countUrl = 'https://spreadsheets.google.com/feeds/list/1kTGYxFBoBJapEmcLEfLINK6GIN9ROOlbSemQwWHG4IU/7/public/values?alt=json';// + '&callback=JSON_CALLBACK';
var rulesUrl = 'https://spreadsheets.google.com/feeds/list/1bfnbkbKOvOantgyI3alYLJQERyNbmkjMTZi-SmxYt6s/2/public/values?alt=json';// + '&callback=JSON_CALLBACK';

var facilities = {};

var process = function() {
  getJSON(countUrl, function(wholeObj) {
    for(var i in wholeObj.feed.entry)
    {
      processFacility(wholeObj.feed.entry[i]);
      processCounts(wholeObj.feed.entry[i]);
    }
    getJSON(rulesUrl, function(wholeObj) {
      for(var i in wholeObj.feed.entry)
      {
        processFacility(wholeObj.feed.entry[i]);
        processTPs(wholeObj.feed.entry[i]);  
      }
      writeObject(facilities);
    });
  });
};

var getJSON = function(url, callback)
{
  var http = require('https');
  http.get(url, function(res) {
      var body = '';

      res.on('data', function(chunk) {
          body += chunk;
      });

      res.on('end', function() {
          console.log("Got response: ", body);
          var response = JSON.parse(body);
          callback(response);
      });
  }).on('error', function(e) {
        console.log("Got error: ", e);
  });
};

var processFacility = function(obj) {
  var key = getKey(obj);
  if(!facilities[key])
  {
    facilities[key] = createFacility(obj);
  }
  return facilities[key];
};

var processCounts = function(obj) {
  var key = getKey(obj);
  facilities[key].counts.push(createCount(obj));
};

var processTPs = function (obj) {
  var key = getKey(obj);
  for(var i in obj)
  {
    if(i.indexOf("gsx$") === -1)
      continue;
    var k = i.replace("gsx$","");
    facilities[key][k] = unwrap(obj[i]);
  }
};

var getKey = function(o)
{ 
  return [unwrap(o["gsx$zone"]), unwrap(o["gsx$lga"]), unwrap(o["gsx$ward"])].join('-').toLowerCase().replace(" ","_").replace(".",""); 
};

var unwrap = function(o)
{
  if(typeof o === 'undefined')
  {
    return o;
  }

  if(o.hasOwnProperty("$t"))
  {
    return unwrap(o["$t"]);
  }
  else
  {
    if(isNumeric(o))
      return parseFloat(o);
    else
      return o.trim();
  }
};

var createFacility = function(o)
{
  var k = getKey(o);
  var f = {
    key: k,
    zone: unwrap(o["gsx$zone"]),
    lga: unwrap(o["gsx$lga"]),
    ward: unwrap(o["gsx$ward"]),
    name: unwrap(o["gsx$hf"]),
    counts: []
  };
  return f;
};

var createCount = function(o)
{
  var c = {};
  for(var i in o)
  {
    if(i.indexOf("gsx$") === -1)
      continue;
    var k = i.replace("gsx$","");
    k = k.replace("_2","_max");
    c[k] = unwrap(o[i]);
    if(k == "day")
    {
      c[k] = new Date(Date.parse(unwrap(o[i])));
    }
  }
  return c;
};

var writeObject = function(o) {
  var fs = require('fs');

  var outputFilename = './facilities.json';

  fs.writeFile(outputFilename, JSON.stringify(o, null, 4), function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("JSON saved to " + outputFilename);
      }
  }); 
};

var isNumeric = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

process();