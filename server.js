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
app.get('/', (req, res) => {
  db.collection('userText').find().toArray((err, result) => {
    if (err) return console.log(err)
    // Renders index.ejs
    res.render('index.ejs', {userText: result})
  })
})

/// Handle GET request - Send SMS to device.
app.get('/message', (req, res) => {
  var twiml = new twilio.TwimlResponse()
  twiml.message("Messaged sms . Thank you!")
  console.log(req.query.Body)
  var text = String(req.query.Body).split(',')
  var date = (text[1])
  var time = (text[2])
  var reason = (text[3])
  var number = req.query.Fromq
  var appointment = {user_date: date, user_time: time, user_reason: reason, user_number: number}

  // Insert some users.
  info.insert([appointment], function (err, result) {
    if (err) {
      console.log(err)
    } else {
      console.log('Inserted %d documents into the "users" collection. The documents inserted with "_id" are:', result.length, result)
    }
    res.writeHead(200, {'content-type': 'text/xml'})
    res.end(twiml.toString())

    // // Close connection.
    // db.close()
  })
})

/// Handle POST request.
app.post('/userText', (req, res) => {
  db.collection('userText').save(req.body, (err, result) => {
    if (err) return console.log(err)
    console.log('saved to database')
  })
})
