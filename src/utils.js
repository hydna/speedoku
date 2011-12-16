(function(app) {

  // Module namespace
  var exports = app.utils = {};


  // Exported functions
  exports.show          = show;
  exports.hide          = hide;
  exports.elem          = elem;
  exports.find          = find;
  exports.findall       = findall;
  exports.each          = each;
  exports.indexof       = indexof;

  exports.on = window.attachEvent ?
    function(e, t, C) { e && e.attachEvent(type, C); } :
    function(e, t, C) { e && e.addEventListener(t, C, true); };


  function show(t) { t.style.display = "block"; }

  function hide(t) { t.style.display = "none"; }

  function elem(t) { return document.createElement(t); }

  function find(q) { return document.querySelector(q); }

  function findall(q) { return document.querySelectorAll(q); }

  function each(t, q, C) {
    var all = t.querySelectorAll(q);
    for (var i = 0, l = all.length; i < l; i++) {
      C(all[i]);
    }
  }

  function indexof(c, n) {
    for (var i = 0, l = c.length; i < l; i++) {
      if (c[i] == n) return i;
    }
  }

})((window.speeduko || (window.speeduko = {})));
