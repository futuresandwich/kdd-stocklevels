var facilities = function ()
{
   var db = require('./facilities.json');
   var results = Object.keys(db).map(function(k,index) {
    return db[k].key;
   });
   console.log(results);
   console.log(results.length);
};
facilities();