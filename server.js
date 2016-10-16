const bodyParser = require('body-parser')
const express = require('express')
const mongoClient = require('mongodb').MongoClient
const path = require('path')
const twilio = require('twilio')
const app = express()
app.set('view engine', 'ejs')


app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')))

var db
var info

/// Connect to MongoDB.
mongoClient.connect('mongodb://emadahmed:emadhello123@ds031611.mlab.com:31611/medsms', (err, database) => {
  if (err) return console.log(err)
  db = database
  info = db.collection('userText')
  // Start the server.
  app.listen(3000, () => {
    console.log('listening on 3000')
  })
})

/// Handle GET request - Serve up home page.
app.get('/home', (req, res) => {
  //db.collection('userText').find().sort( { epoch_date: 1 } )
  db.collection('userText').find().sort( { epoch_time: 1 } ).toArray((err, result) => {
    if (err) return console.log(err)
    // renders index.ejs
    res.render('index.ejs', {userText: result})
  })

  //sdb.close();

})


var nextDate = function(dates, dateWant) {
	for (var i = 0; i < dates.length; i++) {         // iterating through array of epoch times
		if (Math.abs(dates[i] - dateWant) > 1800000) {
			if (dateWant % 1800000 == 0) return dateWant; // if not within 30 minutes of another appointment and a multiple of 30 minutes, return user requested date
			else {
				break;
			}
		}
	}
	var sum = Math.abs(1800000 - (dateWant % 1800000)); // rounds to nearest time that is available if user requested time is not available
	return dateWant + sum;
};




/// Handle GET request - Send SMS to device.
app.get('/message', (req, res) => {
  var twiml = new twilio.TwimlResponse()
  var text = String(req.query.Body).split(',')

  var date = new Date(String(text[1])) // gets date (without time)

  var time = String((text[2])) // gets time in hours:minutes format i.e. 5:06
  time.split(':')

  date.setHours(time.split(':')[0]) // hours  - 5
  date.setMinutes(time.split(':')[1]) // minutes - 06

  console.log("Full date is")
  console.log(date);

  var epochdate = date.getTime() // turns date into epoch time (easier for comparison)




    var epochtimes=[]

    var queryepoch = db.collection('userText').find({},{epoch_time:1, _id:0}).toArray((err, result) => {

      // querying for only the epoch times in the database to see if the user-requested appointment is appropriate
      epochtimes = result
  console.log(result);


      if (err) return console.log(err)
    })

console.log(epochdate)
    console.log("next date is ");
    var appointmentTime = new Date(nextDate(epochtimes,epochdate)) // calls helper function nextDate which returns rounded or requested time


  var reason = (text[3])
  var number = req.query.From

  var appointment = {user_date: date, user_time: time, user_reason: reason, user_number: number, epoch_time: appointmentTime}; // create array to insert into database, with user fields

    // Insert users
    info.insert([appointment], function (err, result) {
      if (err) {
        console.log(err);
      } else {
      }

      twiml.message("Appointment booking successful. Your appointment is at: " + appointmentTime)

      res.writeHead(200, {'content-type': 'text/xml'})
    res.end(twiml.toString())
      //Close connection
    });




})
