var vows = require('vows'),
    assert = require('assert'),
    request = require('request');
vows.describe('Test Login').addBatch({
   'A user logs in': {
       'with invalid creds':{
           topic: function(){
               var options = {
                   url: 'http://www.alphabetters.co/login',
                   method: 'POST',
                   body: {email: 'elirankon@gmail.com', pass:'Elir$fdf'},
                   json: true
               };
               request(options, this.callback);
           },
           'should respond with invalid password': function(error, res, body){
               assert.equal(res.statusCode, 401) && assert.include(body, 'invalid password');
           }
       },
       'with valid creds':{
           topic: function(){
               var options = {
                   url: 'http://www.alphabetters.co/login',
                   method: 'POST',
                   body: {email: 'elirankon@gmail.com', pass:'Elir@nk0n86'},
                   json: true
               };
               request(options, this.callback);
           },
           'should respond with 200': function(error, res, body){
               assert.equal(res.statusCode, 200);
           }
       }
   }
}).export(module);
