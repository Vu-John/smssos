/// Node.js modules.
const fs = require('fs')
const http = require('http')
const path = require('path')

/// Installed modules.
const bodyParser = require('body-parser')
const express = require('express')
const mongoClient = require('mongodb').MongoClient
const twilio = require('twilio')

const app = express()

const MAX_SMS = 100
const mongoCode = 'mongodb://emadahmed:emadhello123@ds031611.mlab.com:31611/medsms'

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')))

var db, info

/// Connect to MongoDB.
mongoClient.connect(mongoCode, (err, database) => {
  if (err) return console.log(err)
  db = database
  info = db.collection('userText')
  // Start the server.
  app.listen(3000, () => {
    console.log('listening on 3000')
  })
})

/// Handle GET request - Serve up home page.
app.get('/', (req, res) => {
  //db.collection('userText').find().sort( { epoch_date: 1 } )
  db.collection('userText').find().sort( { epoch_time: 1 } ).toArray((err, result) => {
    if (err) return console.log(err)
    // Renders index.ejs
    res.render('index.ejs', {userText: result})
  })
  // sdb.close()
})

/// Handle GET request - Send SMS to device.
app.get('/message', (req, res) => {
  console.log('SMS Received: ', req.query.Body)

  handleReq(req, (data) => {
      var twiml = new twilio.TwimlResponse()
      twiml.message(data)
      res.writeHead(200, {'content-type': 'text/xml'})
      res.end(twiml.toString())
  })
})

/// Handle POST request.
app.post('/userText', (req, res) => {
  db.collection('userText').save(req.body, (err, result) => {
    if (err) return console.log(err)
    console.log('saved to database')
  })
})

///
/// Helper Function.
///

/// Appointment for next date.
var nextDate = function(dates, dateWant) {
  console.log(dates)
  for (var i = 0; i <dates.length ; i++) {
    if (dates[i + 1] == null) {
      break
    }
    if (Math.abs(dates[i] - dateWant) >= 1800000 || Math.abs(dates[i + 1] - dateWant) >= 1800000) {
      if (dateWant % 1800000 == 0) {
        console.log("multiple of 30 mins")
        return dateWant
      } else {
        break
      }
    }
  }
  var sum = 1800000 - (dateWant % 1800000)
  console.log("not multiple of 30 mins")
  return dateWant - sum
}

/// Handle request.
function handleReq(req, cb) {
  // Starts with `Download: `.
  var parts = req.query.Body.split(',')
  if (parts[0].toLowerCase() === 'download') {
    var link = parts[1]
    var dest = path.basename(link)

    download(link, dest, (err, data) => {
      if (err)
        throw err
      fs.readFile(dest, 'utf8', (err, data) => {
        if (err)
          throw err
        cb(data)
      })
      console.log('Downloaded: ', link)
    })
  } else if (parts[0].toLowerCase() === 'appointment') {
    // Checks if the message body is formatted correctly.
    if (!isMsgBody(req.query)) {
      cb("Please enter your appointment in the following format: \nappointment,mm/dd/yyyy,HH:MM,<reason>")
      return
    }

    var date = new Date(String(parts[1])) // gets date (without time)
    var time = String((parts[2])) // gets time in hours:minutes format i.e. 5:06
    var reason = (parts[3])
    var number = req.query.From

    time.split(':')
    date.setHours(time.split(':')[0]) // hours  - 5
    date.setMinutes(time.split(':')[1]) // minutes - 06

    console.log("Full date is:")
    console.log(date)

    var epochdate = date.getTime() // turns date into epoch time (easier for comparison)
    var epochtimes=[]
    var queryepoch = db.collection('userText').find({},{epoch_time:1, _id:0}).sort({epoch_time: 1}).toArray((err, result) => {
      // Querying for only the epoch times in the database to see if the user-requested appointment is appropriate.
      epochtimes = result
      console.log(result)
      if (err) return console.log(err)
    })

    console.log(epochdate)
    console.log("next date is ")
    var appointmentTime = new Date(nextDate(epochtimes,epochdate)) // calls helper function nextDate which returns rounded or requested time
    var appointment = {
      user_date: date,
      user_time: time,
      user_reason: reason,
      user_number: number,
      epoch_time: appointmentTime
    }

    // Insert users.
    info.insert([appointment], function (err, result) {
      if (err) {
        console.log(err)
      }

      cb("Appointment booking successful. Your appointment is at: " + appointmentTime)
      console.log(appointment)

      // // Close connection.
      // db.close()
    })
  } else {
    // Handle other cases here.
    return cb(req.query.Body)
  }
}

/// Handle download.
function download(link, dest, cb) {
  var file = fs.createWriteStream(dest)
  var req = http.get(link, (res) => {
    res.pipe(file)
    file.on('finish', () => {
      file.close(cb)
    })
  }).on('error', (err) => {
    fs.unlink(dest)
    if (cb)
      cb(err.message)
  })
  return file
}

/// Check if the date is valid (Format in: mm/dd/yyyy).
function isValidDate(dateString) {
  var dateFormat = /^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/
  if (dateString.match(dateFormat)) {
    return true
  } else {
    return false
  }
}

/// Checks if the time is valid (HH:MM).
function isValidTime(timeString) {
  var militaryTime = /^(((([0-1]{0,1}[0-9])|(2[0-3])):?[0-5][0-9])|(24:?00))$/
  return (timeString.match(militaryTime) !== null)
}

/// Checks if the user's phone number is correctly formatted.
/// Ex:
///   (123) 456-7890
///   123-456-7890
///   123.456.7890
///   1234567890
///   +(123) 456-7890
///   etc...
function isValidPhoneNumber(phoneNumber) {
  var phoneFormat = /^[+]{0,1}[1]{0,1}[(]{0,1}[0-9]{3}[)]{0,1}[-\s\.]{0,1}[0-9]{3}[-\s\.]{0,1}[0-9]{4}$/
  var digits = phoneNumber.replace(/\D/g, "")
  return (digits.match(phoneFormat) !== null)
}

/// Check the message body.
function isMsgBody(msgBody) {
  var text = (String(msgBody.Body).replace(/\s/g, '')).split(',')
  if (!(text.length == 4)) {
    return false
  }
  var keyword = (text[0])
  var date = (text[1])
  var time = (text[2])
  var reason = (text[3])
  var number = msgBody.From
  return (isValidDate(date) && isValidTime(time) && isValidPhoneNumber(number))
}
