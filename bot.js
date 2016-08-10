var _           = require('lodash');
var Client      = require('node-rest-client').Client;
var Twit        = require('twit');
var async       = require('async');
var wordFilter  = require('wordfilter');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var tweet;
var collection;
var db;
var collectionCount;

var t = new Twit({
    consumer_key:        process.env.TWITTERBOT_CONSUMER_KEY // Consumer Key
  , consumer_secret:     process.env.TWITTERBOT_CONSUMER_SECRET // Consumer Secret
  , access_token:        process.env.TWITTERBOT_ACCESS_TOKEN // Access Token
  , access_token_secret: process.env.TWITTERBOT_ACCESS_TOKEN_SECRET  // Access Token Secret
});

// Connection URL. This is where your mongodb server is running.

//var url = 'mongodb://localhost:27017/songwala';
var url = "mongodb://aditya:password@ds145315.mlab.com:45315/songwala"



run = function() {
  async.waterfall([
    connectToDB,
    getCountFromDB,
    fetchTweetFromDB,
    postTweet,
    updateToDB
  ],
  function(err, botData) {
    if (err) {
      console.log('There was an error posting to Twitter: ', err);
    } else {
      console.log('Tweet successful!');
      console.log('Tweet: ', botData);
    }
    console.log('Base tweet: ', botData);
  });
}

connectToDB = function(cb){

  MongoClient.connect(url, function (err, db) {
  var botData = null;
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
    cb(err, botData)
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to', url);
    cb(null,db);
    }
    });


}

getCountFromDB = function(db, cb) {

      console.log("*******getCountFromDB******");
      var myDate = new Date();
      myDate.setDate(myDate.getDate() - 30);
      var query = {$or: [{lastUsed:""},{lastUsed: {$lt:myDate}}]};
      collection = db.collection('tweet');
      collection.find(query).count(function(err, nbDocs) {
      if (!err){
          collectionCount = nbDocs;
          cb(null, db);
      }
      else{
          db.close();
          cb(err, db);
      }
    });
}

fetchTweetFromDB = function(db, cb) {

    console.log("****** fetchTweetFromDB *****");
    console.log("collectionCount is ", collectionCount);
    collection = db.collection('tweet');
    var myDate = new Date();
    myDate.setDate(myDate.getDate() - 30);
    var query = {$or: [{lastUsed:""},{lastUsed: {$lt:myDate}}]};
    collection.find(query).limit(-1).skip(Math.random() * (collectionCount)).toArray(function (err, result) {
    //collection.find({artist: 'R.E.M'}).toArray(function (err, result) {
      if (!err){
        db.close();
        //console.log('Fetched. The documents fetched with "_id" are:', result.length, result);
        //console.log("------", db);
        cb(null, result);
      }
      else {
      //console.log("There was an error getting a public Tweet. Abandoning EVERYTHING");

        db.close();
        cb(err, result);
    }

});
}


postTweet = function(result, cb) {

    console.log("*******postTweet******");
    var x;
    var toTweet;
    tweetData = result;
    console.log(tweetData[0]._id);
    toTweet = tweetData[0].tweet;
    console.log("tweet is ", toTweet);
    //console.log(timeStamp);
    // hardcoding err and false data for now
    var err = false;
    //var botData = null;
    //cb(err, botData);

    //collection = db.collection('tweet');
    //collection.update({_id:tweetData[0]._id}, {$set:{lastUsed:timeStamp}});
    t.post('statuses/update', {status: toTweet}, function(err, data, response) {
    //console.log(data)
      cb(err, tweetData);
    });
}

updateToDB = function(data, cb){
  MongoClient.connect(url, function (err, db) {
  var botData = data;
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
    cb(err, botData)
  } else {
        //HURRAY!! We are connected. :)
        console.log('Connection established to', url);
        var timeStamp = new Date();
        collection = db.collection('tweet');
        console.log("will update: ", botData[0]);
        console.log(timeStamp);
        collection.update({_id:botData[0]._id}, {$set:{lastUsed:timeStamp}}, function(err, results) {
        //collection.update({_id:"asdsadsad"}, {$set:{lastUsed:timeStamp}}, function(err, results) {
        //console.log("bot Data is ", botData);
        db.close();
        //console.log("results are ",results);
        //console.log("results are " +results+ " done");

        cb(err, results);
     });

  //cb(err,botData);
  }
});


}

//run();


setInterval(function() {
  try {
    run();
  }
  catch (e) {
    console.log(e);
  }
}, 60000* 60);
