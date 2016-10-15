const bodyParser = require('body-parser')
const express = require('express')
const MongoClient = require('mongodb').MongoClient
const twilio = require('twilio')
const app = express()
var path = require('path')

app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')))

var db

/// Connect to MongoDB.
MongoClient.connect('mongodb://emadahmed:emadhello123@ds031611.mlab.com:31611/medsms', (err, database) => {
  if (err) return console.log(err)
  db = database
  // Start the server.
  app.listen(3000, () => {
    console.log('listening on 3000')
  })
})

/// Handle GET request - Serve up home page.
app.get('/home', (req, res) => {
  var cursor = db.collection('quotes').find().toArray(function(err, results) {
    console.log(results)
    // Send HTML file populated with quotes here.
  })
  console.log(cursor)
  // Serve index.html file back to the browser.
  res.sendFile(__dirname + '/public/' + 'index.html')
})

/// Handle GET request - Send SMS to device.
app.get('/message', (req, res) => {
  var twiml = new twilio.TwimlResponse()
  twiml.message("Messaged received. Thank you!")
  res.writeHead(200, {'content-type': 'text/xml'})
  res.end(twiml.toString())
})

/// Handle POST request.
app.post('/quotes', (req, res) => {
  db.collection('quotes').save(req.body, (err, result) => {
    if (err) return console.log(err)
    console.log('saved to database')
    res.redirect('/')
  })
})
