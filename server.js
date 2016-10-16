const fs = require('fs')
const http = require('http')
const path = require('path')

const twilio = require('twilio')
const express = require('express')
const bodyParser = require('body-parser')
const mongoClient = require('mongodb').MongoClient

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

function handleReq(req, cb) {
  // starts with `Download: `
  var parts = req.query.Body.split(',')
  if(parts[0].equalsIgnoreCase('download')) {
    var link = parts[1]
    var dest = path.basename(link)

    download(link, dest, (err, data) => {
      if(err)
        throw err
      fs.readFile(dest, 'utf8', (err, data) => {
        if(err)
          throw err
        cb(data)
      })
      console.log('Downloaded: ', link)
    })
  } else if(parts[0].equalsIgnoreCase('appointment')) {
    var appointment = {
      user_date: parts[1],
      user_time: parts[2],
      user_reason: parts[3],
      user_number: req.query.From
    }

    console.log(appointment)

    // Insert some users.
    info.insert([appointment], (err, data) => {
      if (err) {
        console.log(err)
      } else {
        //console.log('Inserted %d documents into the "users" collection. The documents inserted with "_id" are:', data.length, data)
      }

      //cb(data.toString())
      cb('Thanks for booking an appointment, bitch!')

      // // Close connection.
      // db.close()
    })
  } else {
    return cb(req.query.Body)
  }
}


function download(link, dest, cb) {
  var file = fs.createWriteStream(dest)
  var req = http.get(link, (res) => {
    res.pipe(file)
    file.on('finish', () => {
      file.close(cb)
    })
  }).on('error', (err) => {
    fs.unlink(dest)
    if(cb)
      cb(err.message)
  })
  return file
}