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

var db
var info

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
  db.collection('userText').find().toArray((err, result) => {
    if (err) return console.log(err)
    // Renders index.ejs
    res.render('index.ejs', {userText: result})
  })
})

/// Handle GET request - Send SMS to device.
app.get('/message', (req, res) => {
  console.log('SMS Received: ', req.query.Body)

  handleReq(req, (data) => {
    // var snippets = data.match(/.{1, MAX_SMS}/g)
    // for(var i = 0 i < snippets.length i++) {
      // console.log(data[i])
      var twiml = new twilio.TwimlResponse()
      twiml.message(data)
      // twiml.message(snippets[i])
      res.writeHead(200, {'content-type': 'text/xml'})
      res.end(twiml.toString())
    // }
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
/// Helper Methods.
///

/// Handle request.
function handleReq(req, cb) {
  // Starts with `Download: `.
  if (req.query.Body.startsWith('Download: ')) {
    var link = req.query.Body.replace('Download: ', '')
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
  } else if (req.query.Body.startsWith('Appointment')) {
    if (!isMsgBody(req.query)) {
      cb("Please enter your appointment in the following format: appointment,mm/dd/yyyy,HH:MM,<reason>")
      console.log("FAIL")
      return
    }
    var text = String(req.query.Body).split(',')
    var date = (text[1])
    var time = (text[2])
    var reason = (text[3])
    var number = req.query.From
    var appointment = {
      user_date: date,
      user_time: time,
      user_reason: reason,
      user_number: number
    }

    console.log(appointment)

    // Insert some users.
    info.insert([appointment], (err, data) => {
      if (err) {
        console.log(err)
      } else {
        // console.log('Inserted %d documents into the "users" collection. The documents inserted with "_id" are:', data.length, data)
      }

      // cb(data.toString())
      cb('Thanks for booking an appointment BlazeSMS!')

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
