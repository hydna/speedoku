
// Import hydna bindings if we are in a WebWorker.
if (typeof importScripts !== "undefined") {
  // importScripts("http://cdn.hydna.com/1/hydna.js");
  importScripts("../../hydnajs2/dist/lib.js");
}


(function() {
  var nextack;
  var callbacks;
  var subscribers;
  var worker;


  // Internal constants
  var HYDNA_URL         = "127.0.0.1:7010";
  var ANNOUNCE_URL      = HYDNA_URL + "/100";
  var CREATE_URL        = HYDNA_URL + "/101";
  var ANNOUNCE_CHANNEL  = "/100";
  var CREATE_CHANNEL    = "/101";
  var RANDOM_PATTERNS   = [
    "ABADCEDS"
  ];
  var TEMPLATES = [
    "912345678678912345345678912891234567567891234234567891789123456456789123123456789",
    "678431295314529786592687134427158963169342578835976412751864329946213857283795641",
    "784915236561432789239687451427568913318294567695173842846329175973851624152746398",
    "439716825812935476576482913148693257697251384325874691963527148254168739781349562",
    "179452386625738419438691725952176843817349562364285971791564238283917654546823197"
  ];


  // Internal variables
  var post              = null;
  var gamestate         = "idle";
  var dispatchers       = {};
  var round             = null;
  var board             = null;
  var annoChan          = null;
  var gameChan          = null;



  // Export backend interface if bootloader is available (if we are in
  // browser window).
  if (typeof window !== "undefined") {

    window.speeduko.backend = {};

    nextack = 0;
    callbacks = {};
    subscribers = {};

    window.send = function() {
      var args = Array.prototype.slice.call(arguments);
      var graph = { args: args };
      worker.postMessage(JSON.stringify(graph));
    };

    window.speeduko.backend.sendAck = function() {
      var args = Array.prototype.slice.call(arguments);
      var ack = ++nextack;
      var C = args[args.length - 1];
      var graph = { ack: ack, args: args.slice(0) };
      callbacks[ack] = C;
      worker.postMessage(JSON.stringify(graph));
    };

    window.speeduko.backend.subscribe = function(key, C) {
      if (!subscribers[key]) {
        subscribers[key] = [];
      }
      subscribers[key].push(C);
    };

    window.speeduko.backend.unsubscribe = function(key, C) {
      var index;

      if (!subscribers[key] ||
          (index = subscribers[key].indexOf(C)) == -1) {
        return;
      }

      subscribers[key].splice(index, 1);
    };

    setTimeout(function() {
      worker.onmessage = function(e) {
        var msg = JSON.parse(e.data);
        var args = msg.args;
        var callback;

        if ((callback = callbacks[msg.ack])) {
          delete callbacks[msg.ack];
          callback.apply(null, msg.args);
        } else if ((callback = subscribers[args.shift()])) {
          callback.forEach(function(C) {
            C.apply(null, args);
          });
        }
      }
    }, 1);
  }


  // Check if WebWorkers is available, if so, use them, else, emulate
  // them.
  if (typeof window !== "undefined" &&
      typeof Worker !== "undefined" &&
      typeof WebSocket !== "undefined") {
    worker = new Worker("src/backend.js");
    return;
  }


  dispatchers["start-listen-for-games"] = startListenForGames;
  dispatchers["stop-listen-for-games"] = stopListenForGames;
  dispatchers["create-game"] = createGame;


  // Puts client into listening-mode. The event `game-info`
  // is emitted once a new game is available or updated.
  function startListenForGames(ack) {
    if (annoChan) {
      return reply(ack, "Already listening");
    }

    openChannel(ANNOUNCE_URL, "r", function(err, chan) {
      if (err) {
        reply(ack, err.message);
      } else {
        annoChan = chan;
        clientmode = "listen";
        announceImplementations(annoChan);
        reply(ack, null, "ok");
      }
    });
  }


  function stopListenForGames(ack) {
    if (annoChan) {
      annoChan.close();
      annoChan = null;
    }
    clientmode = "";
  }


  function createGame(ack, gameinfo) {

    if (gameChan) {
      return reply(ack, "Already have a game channel active");
    }

    openChannel(CREATE_URL, "rwe", function(err, chan) {
      if (err) {
        reply(ack, err.message);
      } else {
        gameChan = chan;
        gameinfo.id = gameChan.id;
        serverImplementations(gameChan);
        openChannel(ANNOUNCE_URL, "w", function(err, chan) {
          if (err) {
            reply(ack, err.message);
          } else {
            clientmode = "server"
            annoChan = chan;
            announceImplementations(annoChan, gameinfo);
            reply(ack, null, "ok");
          }
        });
      }
    });
  }

  dispatchers["init-game"] = function () {
    send("pong");
    setTimeout(function() {
      var round = {};
      var graph = {};
      board = generateBoard();
      graph.board = board.resolved;
      send("init-round", graph);
    }, 500);
  };


  dispatchers["validate-value"] = function (ack, index, value) {
    if (board.solution[index] == value) {
      reply(ack, null);
    } else {
      reply(ack, true);
    }
  };


  // Opens a channel. The `C` function is called 
  // on success or error.
  function openChannel(url, mode, C) {
    var chan = new HydnaChannel(url, mode);

    function cleanup() {
      chan.onopen = null;
      chan.onerror = null;
      chan.onclose = null;
    }

    chan.onopen = function() {
      cleanup();
      return C(null, chan);
    };

    chan.onerror = function(event) {
      cleanup();
      return C(new Error(event.message || "unknown error"));
    };

    chan.onclose = function(event) {
      cleanup();
      return C(new Error(event.message || "Disconnected"));
    };
  }


  function announceImplementations(chan, gameinfo) {
    var data;

    if (gameinfo) {
      data = JSON.stringify(gameinfo);
      (function broadcast() {
        chan.send(data);
        if (chan.id) setTimeout(broadcast, 2000);
      })();
      return;
    }

    chan.onmessage = function(e) {
      var graph = fromjson(e.data);

      if (!graph) return;

      if (graph.type == "game-info") {
        send(["game-info", {
          id: graph.id,
          name: graph.name,
          players: graph.players,
          nick: graph.nick
        }]);
      }
    };
  }



  function serverImplementations(chan) {
    
  }


  function generateBoard(seed) {
    var tmpl = TEMPLATES[4];
    var masked = {};
    var index = 0;
    for (var x = 0; x < 9; x++) {
      for (var y = 0; y < 9; y++) {
        if (~~(Math.random() * 2)) {
          masked[index] = tmpl[index];
        }
        index++;
      }
    }
    return { resolved: masked, solution: tmpl };
  }


  function send() {
    var args = Array.prototype.slice.call(arguments);
    var graph = { args: args };
    post(JSON.stringify(graph));
  }


  function reply() {
    var args = Array.prototype.slice.call(arguments);
    var graph = { ack: args[0], args: args.slice(1) };
    post(JSON.stringify(graph));
  }


  function messageDispatcher(event) {
    var graph;
    var args;
    var handler;

    graph = fromjson(event.data);

    if (!graph) return;

    args = graph.args;
    handler = dispatchers[args[0]];

    if (handler) {
      if (graph.ack) {
        args[0] = graph.ack;
        handler.apply(null, args);
      } else {
        handler.apply(null, args.slice(1));
      }
    }
  }


  function fromjson(str) {
    try { return JSON.parse(str); } catch (err) { return void(0); }
  }


  if (typeof window == "undefined") {
    post = postMessage;
    (function() { onmessage = messageDispatcher; })();
  } else {
    worker = {};
    worker.postMessage = function(data) {
      var msg = JSON.parse(data);
      messageDispatcher({ data: msg });
    };
    post = function(d) { messageDispatcher({ data: d }); };
  }

})();