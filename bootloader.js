(function(app) {
  var on = window.attachEvent || window.addEventListener;
  var devmode = true;
  var tasks = [];
  var head;
  var body;

  var exports = (app.bootloader = {});


  function eventImpl(elem, next) {

    function cleanup() {
      elem.onerror = elem.onload = elem.onreadystatechange = null;
    }

    elem.onreadystatechange = function() {
      (this.readyState == 4) && (cleanup() || next());
    };

    elem.onerror = function(err) { cleanup(); next(err); };
    elem.onload = function() { cleanup(); next(); };
  }

  function ScriptTask(path) {
    return function(next) {
      var elem = document.createElement("script");
      path = devmode ? path + "?rnd=" + (Math.random() * 100000) : path;
      elem.type = "text/javascript";
      elem.src = path;
      eventImpl(elem, next);
      head.appendChild(elem);
    };
  }

  function CSSTask(path) {
    return function(next) {
      var link = document.createElement("link");
      var img = document.createElement("img");
      path = devmode ? path + "?rnd=" + (Math.random() * 100000) : path;
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = path;
      head.appendChild(link);
      // img.onerror = function() {
      //   body.removeChild(img);
      //   next();
      // }
      // body.appendChild(img);
      // img.src = path;
      next()
    };
  }

  function ImageTask(path) {
    return function(next) {
      var img = new Image(path);
      eventImpl(img, next);
    };
  }

  exports.init = function(opts) {
    opts = opts || {};
    if ("ns" in opts) {
      exports.ns = {};
    }
    if ("scripts" in opts) {
      for (var i = 0; i < opts.scripts.length; i++) {
        tasks.push(ScriptTask(opts.scripts[i]));
      }
    }
    if ("styles" in opts) {
      for (var i = 0; i < opts.styles.length; i++) {
        tasks.push(CSSTask(opts.styles[i]));
      }
    }
  };

  exports.preResource = function(path) {
    switch ((/\.(\w+)$/).exec(path)[1]) {
      case "js":
        tasks.unshift(ScriptTask(path));
        break;
      case "css":
        tasks.unshift(CSSTask(path));
        break;
    }
  };

  exports.append = function(task) {
    tasks.push(task);
  };

  on.call(window, "load", function() {
    head = document.getElementsByTagName("head")[0];
    body = document.getElementsByTagName("body")[0];
    (function next(err) {
      var task = tasks.shift();
      if (err) return alert("load error: " + (err.message || err));
      if (!task) {
        if (app.main) {
          app.main();
        }
        return;
      };
      return task(next);
    })();
  }, true);
})(window.speeduko = {});