
var connection = require("connection");
var resource = require("resource");
var connid = connection.getID().toString(16);
var games;
var gameid;


games = resource.load("speedoku:games");

if ((gameid = games.alloc(connid))) {
  connection.redirect(1000 + gameid);
} else {
  connection.deny("TOO_MANY_GAMES");
}