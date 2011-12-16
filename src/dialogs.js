(function(app) {

  // Module namespace
  var exports = app.dialogs = {};


  // Imports
  var on                = app.utils.on;
  var each              = app.utils.each;
  var elem              = app.utils.elem;
  var find              = app.utils.find;
  var sendAck           = app.backend.sendAck;
  var subscribe         = app.backend.subscribe;
  var unsubscribe       = app.backend.unsubscribe;


  // Exported functions
  exports.show          = show;
  exports.hideAll       = hideAll;


  // Hooks
  exports.oncreate      = function() {};
  exports.onfind        = function() {};
  exports.onabout       = function() {};
  exports.onsettings    = function() {};
  exports.onlol         = function() {};


  // Internal constants
  var MAIN_MENU         = "main-menu";
  var CREATE_GAME       = "create-game";
  var JOIN_GAME         = "game-list";
  var SETTINGS          = "settings";
  var ABOUT             = "about";
  var PLAYER_DETAILS    = "player-details";
  var GAME_DETAILS      = "game-details";


  // Internal variables
  var mainMenu          = null;
  var currentDialog     = null;
  var constructors      = {};


  function show(id) {
    var show = app.utils.show;
    var elem;

    if (currentDialog) {
      hide(currentDialog);
    }

    elem = fromTemplate(id);

    constructors["global"](elem);

    if (id in constructors) {
      constructors[id](elem);
    }

    find("body").appendChild(elem);

    if (id == "main-menu") {
      mainMenu = elem;
    } else {
      currentDialog = elem;
    }

    show(elem);
  }


  function hide(id) {
    var hide = app.utils.hide;
    var elem = typeof id == "string" ? document.getElementById(id) : id;

    find("body").removeChild(elem);

    currentDialog = null;

  }


  function hideAll() {
    if (currentDialog) hide(currentDialog);
    mainMenu && hide(mainMenu);
    mainMenu = null;
  }


  function fromTemplate(expr) {
    var elem = find("." + expr + ".template");
    var clone = elem.cloneNode(true);
    clone.classList.remove("template");
    return clone;
  }


  constructors["global"] = function(dialog) {
    on(dialog.querySelector("a.close"), "click", function() {
      hide(dialog);
    });
  };


  constructors[MAIN_MENU] = function(dialog) {
    on(dialog.querySelector(".create a"), "click", function(e) {
      return exports.oncreate.call(dialog, e);
    });

    on(dialog.querySelector(".find a"), "click", function(e) {
      e.stopPropagation();
      return exports.onfind.call(dialog, e);
    });

    on(dialog.querySelector(".settings a"), "click", function(e) {
      e.stopPropagation();
      return exports.onsettings.call(dialog, e);
    });

    on(dialog.querySelector("a.about"), "click", function(e) {
      e.stopPropagation();
      return exports.onabout.call(dialog, e);
    });
  };


  constructors[SETTINGS] = function(dialog) {
    var nickname = dialog.querySelector("input[name=nickname]");
    var email = dialog.querySelector("input[name=email]");
    var img = dialog.querySelector("img");
    var timer;

    nickname.value = app.settings.getNickname() || "";
    email.value = app.settings.getEmail() || "";
    img.setAttribute("src", app.settings.getImageUrl());

    on(email, "keyup", function(e) {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(function() {
        var url = app.settings.getImageUrl(email.value);
        img.setAttribute("src", url);
        timer = null;
      }, 1000);
    });

    on(dialog.querySelector("a.close"), "click", function(e) {
      if (timer) clearTimeout(timer);
      timer = null;
      app.settings.setNickname(nickname.value);
      app.settings.setEmail(email.value);
    });

  };


  constructors[ABOUT] = function(dialog) { };


  constructors[CREATE_GAME] = function(dialog) {
    var players = dialog.querySelector("select");
    var gamename = dialog.querySelector("input[name=name]");
    var button = dialog.querySelector("button");
    var option;

    for (var i = 2; i < 6; i++) {
      option = elem("option");
      option.name = i;
      option.value = i;
      option.innerText = i + " players";
      players.appendChild(option);
    }


    function listen() {

      if (dialog.classList.contains("listening")) {
        return;
      }

      subscribe("player-join", onplayerjoin);

      dialog.classList.add("listening");

      each(dialog, "input, select", function(input) {
        input.disabled = true;
      });

      setTimeout(function() {
        onplayerjoin("23", "johan", "https://secure.gravatar.com/avatar/9451bc695228777f57356c8488df52e9?s=140&d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-140.png");
      }, 1000)

    }

    function unlisten() {
      if (dialog.classList.contains("listening")) {
        each(dialog, "input, select", function(input) {
          input.disabled = true;
        });
        dialog.classList.remove("listening");
      }
    }


    function onplayerjoin(id, nick, photo) {
      var list = dialog.querySelector(".player-list");
      var li = fromTemplate(PLAYER_DETAILS);
      li.setAttribute("id", "player-" + id);
      li.querySelector("img").src = photo;
      li.querySelector("h3").innerText = nick;
      list.appendChild(li);
    }


    function onplayerleave(id) {

    }


    on(button, "click", function(e) {
      var gameinfo;

      e.preventDefault();

      if (dialog.classList.contains("listening")) {
        // Cancel current game if button was pressed.
      } else {
        // Create a new game

        if (/^[A-Za-z\-\_\s]{2,20}$/.test(gamename.value) == false) {
          alert("Invalid game name");
          return;
        }

        gameinfo = {
          nick: app.settings.getNickname(),
          hash: app.settings.getEmailHash(),
          palyers: players.value,
          name: gamename.value
        };

        sendAck("create-game", gameinfo, function(err) {
          if (err) {
            alert(err);
            dialog.onclose && dialog.onclose.call(dialog, null);
          } else {
          }
        });

        listen();
      }
    });

    on(dialog.querySelector("a.close"), "click", function(e) {
      unlisten();
    });
  };


  constructors[JOIN_GAME] = function(dialog) {
    var list = dialog.querySelector("ul");
    var games = {};

    function ongameinfo(info) {
      var li;

      if (games[info.id]) return;

      games[info.id] = info;
      dialog.classList.remove("empty");

      li = fromTemplate(GAME_DETAILS);
      li.setAttribute("id", "game-" + id);
      // li.querySelector("img").src = photo;
      li.querySelector("h3").innerText = info.name;
      list.appendChild(li);
    }


    dialog.classList.add("empty");

    sendAck("start-listen-for-games", function(err) {
      if (err) {
        alert(err);
        dialog.onclose && dialog.onclose.call(dialog, null);
      } else {
        subscribe("game-info", ongameinfo);
      }
    });

    on(dialog.querySelector("button"), "click", function(e) {
      return exports.onlol && exports.onlol.call(dialog, e);
    });

    on(dialog.querySelector("a.close"), "click", function(e) {
      sendAck("stop-listen-for-games", function() {});
      unsubscribe("game-info", ongameinfo);
    });
  };


})(window.speeduko || (window.speeduko = {}));