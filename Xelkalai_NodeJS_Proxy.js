#!/usr/bin/node

// CS 316 Project 3: NodeJS
// Authors: Thomas Hays and John McNerney
// Files: P3_McNerney1Hays2.js
// Description: This is a nodeJS proxy server that can handle 3 commands: COMIC, SEARCH, MYFILE.
// COMIC takes in a specfic date and writes the corresponding dilbert comic of that date to the web
// browser. SEARCH takes in a search term and writes the corresponding DuckDuckGo search for the
// search term tp the browser. Both COMIC and SEARCH utilize an execution of curl to obtain HTML data
// of specfied sites. MYFILE takes in a HTML file hosted locally on the server and writes the Content
// of that HTML file to the web browser. Hosted on 'pen.cs.uky.edu' with a randomly generated port
// Example URL: http://pen.cs.uky.edu:RANDOMPORT/SEARCH/purple
// or
// Example URL: http://pen.cs.uky.edu:RANDOMPORT/COMIC/2018-10-10
// or
// Example URL: http://pen.cs.uky.edu:RANDOMPORT/MYFILE/index.html

var http = require("http"), // include http module
	url = require('url'), // include url module
	exec = require("child_process").exec, // include exec child_process mudle
	fs = require('fs'); // inlcude file system module

const LOWERPORT = 2000; // global const of LOWERPORT defined in spec
const UPPERPORT = 35000; // global const of UPPERPORT defined in spec
const hostname = 'pen.cs.uky.edu'; // hosted at pen.cs.uky.edu. this can be changed tho

// calculateRandomPort() uses a JS method to generate a random port number in the proper range
function calculateRandomPort() {
	return Math.floor(Math.random() * (UPPERPORT - LOWERPORT + 1)) + LOWERPORT;
}
// end of calculateRandomPort()

// callExec() used by giveComic and doSearch to make an exec sys call. Calls curl by appending the passed URL
// to the command and calls an anonmyous function that checks for error but otherwise writes to browser and ends
// the response.
function callExec(requestedURL, response) {
	exec("curl "+requestedURL+"", {env: {'PATH': '/usr/bin'}}, function(error,stdout,stderr) { // anon function since exec is async
		// if (error) { // if there is an error executing
		// 	console.error('exec error: ${error}');
		// 	return;
		// }
		response.write(stdout); // write the standard output of curl to the web browser
		response.end(); // end the connection
	});
}
// end of callExec()

// giveComic() takes the sanitized input from validateURL and the response from createServer. Slices the
// url to pull the date in order to construct the proper URL. Then calls Exec to run curl command
function giveComic(xurl,response) {
var matchingExpressions = xurl.match(/[0-9]{4}-+[0-9]{2}-+[0-9]{2}|CURRENT/g); // pulls the date out of the URL
	if (matchingExpressions[0] == "CURRENT") { // if user selected CURRENT, just load dilbert.com
		var requestedURL = "http://dilbert.com";
	}
	else { //else construct URL with proper date
		var requestedURL =  "http://dilbert.com/strip/"+matchingExpressions[0]+"";
	}
callExec(requestedURL,response); // executes curl with proper URL
}
// end of giveComic()

// doSearch() takes the sanitized input from validateURL and the response from createServer. Slices
// the url to pull the search term out to construct the proper DuckDuckGo URL, then calls exec
function doSearch(xurl, response) {
	var matchingExpressions = xurl.match(/[a-zA-z0-9]*$/); // pulls search term out of URL
	var requestedURL = "https://duckduckgo.com/html/?q="+matchingExpressions[0]+"&ia=web"; //creates proper search URL
	callExec(requestedURL,response); // executes curl with proper URL
}
// end of doSearch()

// giveFile() takes the sanitized input from validateURL and the response from createServer. Slices
// the url to pull the file name out to check if it exists, if so reads the data from the html file and
// writes to the screen.
function giveFile(xurl, response) {
	var matchingExpressions = xurl.match(/([a-zA-Z0-9\s_\\.\-\(\):])+(\.html)$/); //pulls file name out of url
	if (fs.existsSync("./private_html/"+matchingExpressions[0]+"")) { // check if file exists in local directory as defined in project specs
		console.log("VALID Request: File Exists"); // makes a console log to confirm that file exists
		fs.readFile("./private_html/"+matchingExpressions[0]+"", function(err, data){ // if it exists, read from it
			if (err) { // if there is an error reading file, console log error
				console.error('readfile error: ${err}');
				return;
			}
			response.write(data); // write html file to browser
			response.end(); // end response
		});
	}
	else { // if it does not exist
		console.log("BAD Request: File does not Exist"); //logs the fact that file does not exist
		response.write("<h1>403 Error ! File does not exist !</h1>"); // prints error 403 to web browser
		response.statusCode = 403; // changes status code to file not found
		response.end(); // ends response
		return; // exits function
	}
}
// end of giveFile()

function doTweet(xurl, response) {
	var matchingExpressions = xurl.match(/[a-zA-z0-9]*$/);
	var requestedURL = "https://twitter.com/"+matchingExpressions[0]+"";
	console.log(requestedURL);
	callExec(requestedURL,response);
}

// validateURL() tests the input URL against 3 regular expressions to determine what kind of request it is. If
// it is not a valid form of request, it is deemed a bad request and the response is ended with no output. If it is
// valid, call the corresponding command functions to handle the request.
function validateURL(xurl,response) {
	const comicRegularExpression = /\/COMIC\/[0-9]{4}-+[0-9]{2}-+[0-9]{2}|CURRENT/; // regular expression for valid comic request. Has to be in formt '/COMIC/2018-10-30'.
	const searchRegularExpression = /\/SEARCH\/[a-zA-z0-9]*$/; // regular expression for any valid duck duck go search. Has to be in format of '/SEARCH/apple'
	const myfileRegularExpression = /\/MYFILE\/([a-zA-Z0-9\s_\\.\-\(\):])+(\.html)$/i; // regular expression for any valid myfile request. Has to be in format '/MYFILE/something.html'.
	const tweetRegularExpression = /\/TWEET\/[a-zA-z0-9]*$/; // regular expression for any valid duck duck go search. Has to be in format of '/SEARCH/apple'
	if (comicRegularExpression.test(xurl)){ // if it is a comic request
		console.log("VALID URL Requested: "+xurl+"");
		giveComic(xurl,response);
	}
	else if (searchRegularExpression.test(xurl)) { // if it is a search request
		console.log("VALID URL Requested: "+xurl+"");
		doSearch(xurl, response);
	}
	else if (myfileRegularExpression.test(xurl)) { // if it is a myfile request
		console.log("VALID URL Requested: "+xurl+"");
		giveFile(xurl, response);
	}
	else if (tweetRegularExpression.test(xurl)) { // if it is a tweet request
		console.log("VALID URL Requested: "+xurl+"");
		doTweet(xurl,response);
	}
	else {
		console.log("BAD URL Requested: "+xurl+"");
		response.write("<h1>ERROR. Bad URL Requested!</h1>"); // prints error to browser
		response.end(); // ends response
		return; // returns functions
	}
}
// end of validateURL()

// serveURL() is the request listner for create server. Gets xurl, ignores icon request, calls validateURL
function serveURL(request, response) {
	var xurl = request.url; // pulls everything after base url
	if (xurl == "/favicon.ico") { // ignores the request for an icon so it does not get processed
		return;
	}
	response.statusCode = 200; // sets initial status code
	response.setHeader('Content-Type', 'text/html'); // sets content type
	validateURL(xurl,response);
}
// end of serveURL()

// startServer() calls calculateRandomPort and creates server/listens
function startServer() {
var generatedRandomPort = calculateRandomPort(); // generates random port
var server = http.createServer(serveURL); // calls create server with callback function of serveURL
server.listen(generatedRandomPort,hostname); // listens on the generated port name and const host
console.log("Server started. Listening on http://"+hostname+":"+generatedRandomPort+"");
}
// end of startServer()

startServer(); // entry point for program
