# ![blazesms_lower_icon](https://cloud.githubusercontent.com/assets/15070059/19416115/dad6e0ce-9355-11e6-89c0-9e40b19e5c74.png) BlazeSMS


Blaze SMS is an SMS internet service that works by sending text messages to a server and recieving information back from the server based on your request though your phone.

Using Node.js and the Twilio API we were able to create a customizable platform for an internet service without the need for a data plan. Our server bridges the traditional sms messaging-internet gap previously seen in the past to create a new and exciting service with many everyday applications.

### Who is it for?
  - Healthcare Industry
  - Emergency Medical Services
  - The everyday averge Joe
 
### What tech does it use?
* [Twitter Bootstrap](http://getbootstrap.com/) - great UI boilerplate for modern web apps
* [node.js](https://nodejs.org/en/) - evented I/O for the backend
* [Express](http://expressjs.com/) - fast node.js network app framework 
* [MongoDB](https://www.mongodb.com/) - open source, scalable, document database
* [Twilio](https://www.twilio.com/) - cloud sms and voip platform

### How do I use it?
We've taken the liberty of including all the node modules in the repository but you can update them to the lastest versions when they come out. To use is very simple, just send a predetermined, structured text message to the server "Phone number" and await your responce containing the information you desired.

To run the server itself, you must first have a twilio account and mongoDB set up and re-routed to your locations and then run the server by calling node in your server directory
```
$ node mainServerFile.js
```

#### Appointment Module
This is our first and main demo module for HackWestern3 that shows how an appointment can be made quickly and efficently using our custom text messaging peramiters. Simply text the chosen server phone number
```
appointment, date, time, reason 
```
Where "appointment" is just the word appointment because we are telling the server to use the appointment module, "Date" is the date you want to schedule the appointment in (MM/DD/YYYY) format, "time" is the time of day in **24 hour time**, and "reason" is simply your explanation for why you want to schedule a visit.

For example:
```
appointment, 10/20/2016, 11:45, I have had a constant ringing in my ears the past few months and would like to see if I can get it checked out
```
The server will then process your request and shedule the next free time slot for your appointment on that date, put the appointment in a database and send you a message back confirming when you are scheduled to come in.
####  Download Module
The download module is very exciting because we have created a system in which you can request a file from an address and the server will translate that file into ascii text and send you the file via text message. Right now it really only works for reading text documents or simple files without formatting but its a proof of concept that can be easily expanded. To use the download module simply type download then the url to the file you are trying to see
```
download, fileURL
```

### Web Interface - Doctor's Office
<img width="1200" alt="tool_doc" src="https://cloud.githubusercontent.com/assets/15070059/19417729/581b58b8-9382-11e6-9076-8ffd5d067c6b.png">


## Thanks HackWestern!
We are all so thankfull for being able to attend HackWestern3 this year and can't wait to see everyone's projects! 
