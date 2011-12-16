(function(app) {

  app.main = function() {
    app.dialogs.show("main-menu");
  };

  app.dialogs.oncreate = function() {
    app.dialogs.show("create-game")
    return true;
  };

  app.dialogs.onfind = function() {
    app.dialogs.show("game-list");
    return true;
  };

  app.dialogs.onabout = function() {
    app.dialogs.show("about");
  };

  app.dialogs.onsettings = function() {
    app.dialogs.show("settings");
  };

  app.dialogs.onlol = function() {
    var board;
    console.log("onlol")
    app.dialogs.hideAll();
    board = app.board.createBoard();
    app.utils.find("body").appendChild(board);
    app.utils.show(board);
    send("create-game");
  };

})((window.speeduko || (window.speeduko = {})));
