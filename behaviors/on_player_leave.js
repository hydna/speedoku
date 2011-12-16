
var connection              = require("connection");
var resource                = require("resource");
var connid                  = connection.getID().toString(16);
var channel                 = null;
var games                   = null;
var slotid                  = null;
var message                 = null;


games = resource.load("speedoku:games");

if ((gameid = games.find(connid))) {
  // Check if current user is admin. If so, kill
  // the channel and free it up from the game cache.
  channel = GAME_CHANNEL_START + slotid;
  connection.endChannel(script.env.CHANNEL, "GAME_ENDED");
} else {
  // Tell all other user on channel that user have leaved.
  message = "notif:user-leave " + connid;
  connection.emitChannel(script.env.CHANNEL, message);
}