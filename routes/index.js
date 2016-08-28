var express = require('express');
var router = express.Router();
var session = require('express-session');
var moment = require('moment');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var accountSid = 'ACad430abde5c1f9c8b2fa969120a96c8d'; // Your Account SID from www.twilio.com/console
var authToken = '35400da6d0828d8c07d7cc85219b8326';   // Your Auth Token from www.twilio.com/console
var twilio = require('twilio');
var client = new twilio.RestClient(accountSid, authToken);
//mongoose.connect('mongodb://localhost/socialcops');
mongoose.connect('mongodb://socialcops:socialcops@ds017736.mlab.com:17736/socialcops');

var db=mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
  console.log(' db connected ');
});

var personSchema = mongoose.Schema({
  number : String,
  name : String,
  password : String,
  sleeptime : String,
  awaketime : String,
  service: Boolean,
  sendAt: String,
  currentCount : Number,
  workingSince : Number
});

var user = mongoose.model('user', personSchema);

var logSchema = mongoose.Schema({
  number: String,
  time: String,
  status: String,
  attempt : String
});

var log = mongoose.model('log', logSchema);

router.get('/', function(req, res) {
 var sess = req.session;
    if(sess.number) {
		res.redirect('/admin');
    } else {
       res.render('index.html', { title: 'Amnesia Application' });
    }
  
});

router.get('/login', function(req, res) {

  res.render('login.html', { title: 'Amnesia Apllication', pagetitle : 'Login'  });

});

router.get('/register', function(req, res) {
  res.render('register.html', { title: 'Amnesia Apllication', pagetitle : 'Register' });
});

router.post('/logindetails',function(req,res){

  user.findOne({ number : req.body.number }, function (err, users) {
     if (err) return console.error(err);

     if(users){
       if(users.number==req.body.number && users.password==req.body.password){
         console.log(users.password+" "+users.number); // Space Ghost is a talk show host.
         var sess=req.session;
         sess.number=req.body.number;

         res.end('done');
       }else{
         res.end("User name and password doesnt match");
       }
     }else{
       res.end("Not registerd Please register to get logged in")
     }

   });

});

router.get('/admin', function(req, res) {
    var sess = req.session;
    if(sess.number) {
        
      user.findOne({number : sess.number}, function (err, userl) {
        userl.name= req.body.name;
        res.render('admin.html', {number : sess.number,service : userl.service });
        userl.save();
      });
        

    } else {
        res.write('<h1>Please login first.</h1>');
        res.end('<a href="/login">Login</a>');
    }

  // res.render('admin.html', { title: 'register'});
});

router.get('/resetname',function(req,res){
    var sess=req.session;
    if(sess.number){
      res.render('resetname.html', { title: 'Amnesia Apllication', pagetitle : 'Resetname'  })
    }else{
      res.write('<h5>Please Login</h5>');
      res.end('<a href="/login">Login</a>');
    }
});

router.post('/resetname',function(req,res){
    var sess=req.session;
    if(sess.number){
      user.findOne({number : sess.number}, function (err, userl) {
        userl.name= req.body.name;
        userl.save();
        res.end("done");
      });
    }else{

      res.end('Please Login First'+'    '+'<a href="/login">Login</a>');
    }
});

router.get('/editsleeptime',function(req,res){
    var sess=req.session;
    if(sess.number){
      res.render('editsleeptime.html', { title: 'Amnesia Apllication', pagetitle : 'Edit Sleep timings'  })
    }else{
      res.write('<h5>Please Login</h5>');
      res.end('<a href="/login">Login</a>');
    }
});

router.post('/editsleeptime',function(req,res){
    var sess=req.session;
    if(sess.number){
      user.findOne({number : sess.number}, function (err, userl) {
        userl.sleeptime=req.body.sleeptime;
        userl.awaketime=req.body.awaketime;
        userl.save();
        res.end("done");
      });
    }else{

      res.end('Please Login First'+'    '+'<a href="/login">Login</a>');
    }
});



router.post('/registrationdetails',function(req,res){

  user.findOne({ number : req.body.number }, function (err, users) {
     if (err) return console.error(err);

     if(users){
        res.end("Number already registered please register with the other number")

     }else{

       var member=new user();
       member.number=req.body.number;
       member.name=req.body.name;
       member.password=req.body.password;
       member.sleeptime=req.body.sleeptime;
       member.awaketime=req.body.awaketime;
       member.currentCount = 0;
       member.sendAt = '';
       member.service = false;
       member.workingSince = 0;
      //  console.log('inside registrationdetails');
       member.save(function (err) {
         if (err) return console.error(err);
         console.log('inserted successfully');
         console.log(req.body.number);
         res.end('done');
       });


     }

   });
})

router.get('/registrationcomplete', function(req, res) {

        // setInterval(send_message,10000);
        res.write('<h1>Hey you are registered, please login to start the service.</h1>');
        res.end('<a href="/login">Login</a>');
});

send_message();

router.post('/servicestarted',function(req,res){

  var sess=req.session;

  var uniqnumber;
  if(sess.number){
    uniqnumber = sess.number;
    user.findOne({number : uniqnumber}, function (err, result) {
      if (err) {
        return res.end(err.toString());
      }


      if(moment().hour()<10){
        var currentTime="0"+moment().hour()+":"+moment().minute()+":"+moment().second();
      }else {
        var currentTime=moment().hour()+":"+moment().minute()+":"+moment().second();
      }




      // var currentTime=moment().hour()+":"+moment().minute()+":"+moment().second();
      console.log("ct ====="+currentTime);
      var x=addHour(currentTime);
      result.sendAt = addHour(currentTime);// fill time here, add current time plus 1 hour
      console.log("x ====="+x);
      result.service = true;
      result.save();
      res.end("done");
    });
    // runningSince=1;
    // service=setInterval(send_message,30000);
  }else{
    res.end("Please Login to do the following.");
  }


});

function addHour(input) {
  var hour = input.substring(0,2);
  var res = input.substring(2);
  hour = parseInt(hour);
  hour = hour + 1;
  if (hour == 24) {
    hour = 0;
  }
  res = hour + res;
  return res;
}

router.post('/servicestopped',function(req,res){

  var sess = req.session;
  var uniqnumber;
  if(sess.number){
    uniqnumber = sess.number;
    user.findOne({number : uniqnumber}, function (err, result) {
      if (err) {
        return res.end(err.toString());
      }
      result.service = false;
      result.workingSince = 0;
      result.sendAt = "";
      result.save();
      res.end("done");
    });
  }else{
    res.end("Please Login to do the following.");
  }

});

router.get('/logout',function(req,res){
    req.session.destroy(function(err) {
      if(err) {
        console.log(err);
      } else {
        res.redirect('/');
      }
    });
});

router.get('/logs',function(req,res){
  var sess=req.session;
  if(sess.number){

    log.find({number : sess.number}, function (err, logs) {
    	 user.findOne({number : sess.number}, function (err, userl) {
          res.render('logs.html',{number : sess.number,log : logs, workingSince : userl.workingSince});
         });
       
    });

  }else{
    res.write('<h1>Please login first.</h1>');
    res.end('<a href="/login">Login</a>');
  }

});

function message(dataArray){

    console.log("inside mesage");

    var count = 0;
    var retry = [];
    for (var i = 0; i < dataArray.length; i++) {
      var data = dataArray[i];
      // console.log('data == ', data);
      client.messages.create({
          body: data.name + " hello nik",
          to: data.number,  // Text this number
          from: '+17637102328' // From a valid Twilio number
      },function (err, response) {
        count++;
        // console.log(err, response);
        user.findOne({number: response.to}, function (err, resp) {
          if (response.status == "undelivered" || response.status=="failed") {
            resp.currentCount = resp.currentCount + 1;
            if (resp.currentCount == 5) {

              if(moment().hour()<10){
                var currentTime="0"+moment().hour()+":"+moment().minute()+":"+moment().second();
              }else {
                var currentTime=moment().hour()+":"+moment().minute()+":"+moment().second();
              }
              // var currentTime=moment().hour()+":"+moment().minute()+":"+moment().second();
              resp.currentCount = 0;
              resp.sendAt =addHour(currentTime);  // current time + 1 hr
            }else{

              var currentTime=moment().hour()+":"+moment().minute()+":"+moment().second();
                 //if(resp.currentCount < 5)
              var failedLog=new log();
              failedLog.number=resp.number;
              failedLog.time=currentTime;
              failedLog.status=response.status;
              failedLog.attempt=resp.currentCount;
              failedLog.save();

              retry.push({name : resp.name, number: resp.number});
            }
            resp.save();
          }
          else{

            if(moment().hour()<10){
              var currentTime="0"+moment().hour()+":"+moment().minute()+":"+moment().second();
            }else {
              var currentTime=moment().hour()+":"+moment().minute()+":"+moment().second();
            }

            var successLog=new log();
            successLog.number=resp.number;
            successLog.time=currentTime;
            successLog.status=response.status;
            successLog.attempt=resp.currentCount;
            successLog.save();

            resp.currentCount = 0;
            resp.sendAt = addHour(currentTime); // current time + 1 hr
            resp.save();
          }
        });
        if (count == dataArray.length) {
          if (retry.length > 0) {
            message(retry);
          }
        }

      });
    }
}

setInterval(send_message, 59999);

function send_message(){
  // setInterval(send_message, 4999);

  console.log('inside send message');
  var Ids = [];
  var currentTime=moment().hour()+":"+moment().minute()+":"+moment().second();
  // console.log(currentTime);
  console.log("currentTime ===", currentTime);
  user.find({service : true}, function (err, users) {
    if (err) {
      return send_message();
    }
    console.log('before for loop');
    for (var i = 0; i < users.length; i++) {
      console.log('sendAt', users[i].sendAt);
      if(moment(currentTime, "hh:mm:ss").isAfter(moment(users[i].awaketime, "hh:mm:ss"))&&moment(currentTime, "hh:mm:ss").isBefore(moment(users[i].sleeptime, "hh:mm:ss"))){
          console.log("gone in to send message");
          var userSendAt = moment(users[i].sendAt, "hh:mm:ss");;
          currentTime = moment(currentTime, "hh:mm:ss");;
          console.log('send At == ', users[i].sendAt);
          var duration = moment.duration(userSendAt.diff(currentTime));
          console.log("duration == ", duration.asMinutes());
          if (duration.asMinutes() <= 1 && users[i].currentCount < 5) {
            user.findOne({number : users[i].number}, function (err, userl) {
              userl.workingSince= userl.workingSince+1;
              userl.save();
            });

            console.log('adding to array');
            Ids.push({name: users[i].name, number: users[i].number});
          }

      }else{
      
      	  user.findOne({number : users[i].number}, function (err, userl) {
          userl.sendAt= userl.awaketime;
          userl.save();
           console.log("sleeping time"+"   "+"send at set successfully to awaketime");
          });
       
      }
    }
    // users.save();
    if (Ids.length > 0) {
      // console.log(Ids);
      console.log('calling message');
      message(Ids);
    }
  });

}

module.exports = router;

