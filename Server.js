/**
 * 
 */

var express = require('express');
var url = require('url');
var app = express();
var fs = require('fs');
const { parse } = require('querystring');
var path = require('path');

//USER data
var usrFile = __dirname+'/lib/usrData.JSON';
var usrJsn = JSON.parse(fs.readFileSync(usrFile, 'utf8'));
var usrName;
var userIndex;

//SCHEDULE data
var sFile = __dirname+'/lib/serviceData.JSON';
var sJsn = JSON.parse(fs.readFileSync(sFile, 'utf8'));

app.use(express.static(path.join(__dirname, 'views')));

console.log(__dirname+'/IEBanner.jpg');

//APP start
app.set('view engine', 'pug');

	app.get('/', function(req, res) {
		res.render('homepage.pug', { message : "It is so good to see you!"})
	});
	app.get('/Register', function(req, res) {
		res.render('register.pug', {header: "Welcome!"})
	});
	app.post('/regCheck', function(req, res) {
		var body = "";
		req.on('data', chunk=>{
			body += chunk.toString();
		});
		req.on('end', () =>{
			reqJsn = parse(body);
			
			//Find if username already exists
			var f;
			var index;
			var found;
			found = usrJsn.profiles.some(function(item, index){f = index; return item.userName==reqJsn.userName});
			
			if(found){
				res.render('register.pug', {header : "Username already taken"})
			} else if(reqJsn.userName == '') {
				res.render('register.pug', {header : "Please enter a username"})
			} else if(reqJsn.psw.length < 6) {
				res.render('register.pug', {header : "Password must be at least 6 characters"})
			} else if(reqJsn.psw != reqJsn.psw1) {
				res.render('register.pug', {header : "Passwords do not match!"})
			} else if((reqJsn.fName || reqJsn.lName) == '') {
				res.render('register.pug', {header : "Please enter your name"})
			} else if(isNaN(reqJsn.pNumber) || reqJsn.pNumber.length != 10) {
				res.render('register.pug', {header : "Please enter a valid phone number"})
			}
			else {
				reqJsn.id = usrJsn.profiles.length + 1;
				usrJsn.profiles.push(reqJsn);
				
				fs.writeFile(usrFile, JSON.stringify(usrJsn, null, 2), 'utf-8', function(err, result){
					if(err) console.log('error while writing file', err);
					});
					
				res.render('redirectHome.pug');
				}
			
		})
		
	});
	app.post('/Welcome', function(req, res) {
		var body = "";
		req.on('data', chunk=>{
			body += chunk.toString();
		});
		req.on('end', () =>{
			reqJsn = parse(body);
			
			var bool = false;
			
				for(var i in usrJsn.profiles){
					if(usrJsn.profiles[i].userName == reqJsn.uname){
						userIndex = i;
						if(usrJsn.profiles[i].psw == reqJsn.psw) {
							bool = true;
						}
					}
				}
			if(bool) {
				res.render('welcome.pug', {uName : usrJsn.profiles[userIndex].fName});
			} else {
				res.render('redirectHome1.pug');
			}
		})
	});
	app.get('/Welcome', function(req, res) {
		res.render('welcome.pug', {uName : usrJsn.profiles[userIndex].fName});
	});
	
	app.get('/Rentals', function(req, res) {
		res.render('rentals.pug', { result: sJsn.bRental, activity: sJsn.activity});

	});
	app.post('/rentCheck', function(req, res) {
		var body = "";
		req.on('data', chunk=>{
			body += chunk.toString();
		});
		req.on('end', () =>{
			reqJsn = parse(body);

			reqJsn.userId = usrJsn.profiles[userIndex].id;
			reqJsn.id = sJsn.bRental.length + 1;
			
			var bool = true;
			
			for(var i in sJsn.bRental){
				if(reqJsn.date == sJsn.bRental[i].date){
					if(reqJsn.timeS >= sJsn.bRental[i].timeS && reqJsn.timeS < sJsn.bRental[i].timeE){
						bool = false;
					} else if(reqJsn.timeE > sJsn.bRental[i].timeS && reqJsn.timeE <= sJsn.bRental[i].timeE){
						bool = false;
					}
				}
			}
			for(var i in sJsn.activity){
				if(reqJsn.date == sJsn.activity[i].date){
					if(reqJsn.timeS >= sJsn.activity[i].timeS && reqJsn.timeS < sJsn.activity[i].timeE){
						bool = false;
					} else if(reqJsn.timeE > sJsn.activity[i].timeS && reqJsn.timeE <= sJsn.activity[i].timeE){
						bool = false;
					}
				}
			}
			if(bool){			
				var payment;
				
				payment = parseInt(reqJsn.timeE, 10) - parseInt(reqJsn.timeS, 10);
				console.log(payment);
				sJsn.bRental.push(reqJsn);
				
				fs.writeFile(sFile, JSON.stringify(sJsn, null, 2), 'utf-8', function(err, result){
						if(err) console.log('error while writing file', err);
						});		
				res.render('checkout.pug', {due : "Amount due, $"+payment});						
			}else{
				res.render('rentals.pug', { result: sJsn.bRental, activity: sJsn.activity, display: "That time is taken"});
			}
		})
	});
	app.get('/Activities', function(req, res) {
		res.render('activities.pug', {activity: sJsn.activity});

	});
	app.post('/activityCheck', function(req, res) {
		var body = "";
		req.on('data', chunk=>{
			body += chunk.toString();
		});
		req.on('end', () =>{
			reqJsn = parse(body);
			
			var actIndex;
			
			for(var i in sJsn.activity){
				if(reqJsn.id == sJsn.activity[i].id){
					actIndex = i;
				}
			}

			if(parseInt(reqJsn.qty, 10) > sJsn.activity[actIndex].available){
				res.render('activities.pug', {activity: sJsn.activity, display: "Not enough spots available"});
			} else{
				var payment = 10 * parseInt(reqJsn.qty, 10);
				
				sJsn.activity[actIndex].available = sJsn.activity[actIndex].available - parseInt(reqJsn.qty, 10);
				fs.writeFile(sFile, JSON.stringify(sJsn, null, 2), 'utf-8', function(err, result){
						if(err) console.log('error while writing file', err);
						});
				res.render('checkout.pug', {due : "Amount due, $"+payment});
			}			
		})		
	});
	app.get('/Donate', function(req, res) {
		res.render('checkout.pug', {due : "You are amazing."});
	});
	app.get('/Wellness', function(req, res) {
		res.render('wellness.pug', {result: sJsn.wellness});
	});
	app.post('/WellnessCheck', function(req, res) {
		var body = "";
		req.on('data', chunk=>{
			body += chunk.toString();
		});
		req.on('end', () =>{
			reqJsn = parse(body);
			
			reqJsn.userId = usrJsn.profiles[userIndex].id;
			reqJsn.id = sJsn.wellness.length + 1;
			
			var bool = true;
			
			for(var i in sJsn.wellness){
				if(reqJsn.date == sJsn.wellness[i].date){
					if(reqJsn.timeS >= sJsn.wellness[i].timeS && reqJsn.timeS < sJsn.wellness[i].timeE){
						bool = false;
					} else if(reqJsn.timeE > sJsn.wellness[i].timeS && reqJsn.timeE <= sJsn.wellness[i].timeE){
						bool = false;
					}
				}
			}

			if(bool){			
				var payment;
				
				payment = 100;
				sJsn.wellness.push(reqJsn);
				
				fs.writeFile(sFile, JSON.stringify(sJsn, null, 2), 'utf-8', function(err, result){
						if(err) console.log('error while writing file', err);
						});		
				res.render('checkout.pug', {due : "Amount due, $"+payment});						
			}else{
				res.render('wellness.pug', { result: sJsn.wellness, display: "That time is taken"});
			}
		})				
	});
	
app.listen(8002);
console.log('Server is listening on port 8002');