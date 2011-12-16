(function(app) {


  // Module namespace
  var exports = app.board = {};


  // Imported functions
  var floor             = Math.floor;
  var on                = app.utils.on;
  var elem              = app.utils.elem;
  var find              = app.utils.find;
  var findall           = app.utils.findall;
  var indexof           = app.utils.indexof;
  var subscribe         = app.backend.subscribe;
  var sendAck           = app.backend.sendAck;


  // Exported functions
  exports.createBoard   = createBoard;



  // Function placeholders


  // Scope globals

  // Variable allCells is a cache where cells are aliged horizontal
  // instead of groups.
  var cellsByRow;


  function createBoard() {
    var wrapper = elem("section");
    var group;
    var rows;
    var cell;
    var row;
    var index;

    wrapper.setAttribute("id", "game");
    wrapper.className = "board";

    rows = [[], [], [], [], [], [], [], [], []];
    cellsByRow = [];

    for (var x = 0; x < 9; x++) {
      group = elem("div");
      group.className = "group";
      for (var y = 0; y < 9; y++) {
        cell = elem("input");
        cell.className = "cell";
        row = (floor(x / 3) + floor(y / 3)) + (floor(x / 3) * 2);
        rows[row].push(cell);
        group.appendChild(cell);
      }
      wrapper.appendChild(group);
    }

    // Concat all rows into a singel array.
    index = 0;
    for (var x = 0; x < 9; x++) {
      row = rows[x];
      for (var y = 0; y < 9; y++) {
        row[y].setAttribute("id", "cell-" + index);
        cellsByRow.push(row[y]);
        index++;
      }
    }

    return wrapper;
  }


  function getHorizontalElem(nodes, selected, dir) {
    var size = nodes.length == 9 ? 3 : 9;
    var index = indexof(nodes, selected);
    var row = floor(index / size);
    var col = index % size;
    var newcol = col + dir;

    if (newcol > (size - 1)) {
      index = (row * size);
    } else if (newcol < 0) {
      index = (row * size) + (size - 1);
    } else {
      index = index + dir;
    }

    return nodes[index];
  }

  function getVerticalElem(nodes, selected, dir) {
    var size = nodes.length == 9 ? 3 : 9;
    var index = indexof(nodes, selected);
    var row = floor(index / size);
    var col = index % size;
    var newrow = row + dir;

    if (newrow > (size - 1)) {
      index = col;
    } else if (newrow < 0) {
      index = ((size - 1) * size) + col;
    } else {
      index = (newrow * size) + col;
    }

    return nodes[index];
  }

  function navGroupH(selected, dir) {
    var curr = selected.parentNode;
    var nodes = curr.parentNode.childNodes;
    var next = getHorizontalElem(nodes, curr, dir);
    next.childNodes[4].focus();
  }

  function navGroupCellH(selected, dir) {
    var nodes = selected.parentNode.childNodes;
    var next = getHorizontalElem(nodes, selected, dir);
    next.focus();
  }

  function navGroupV(selected, dir) {
    var curr = selected.parentNode;
    var nodes = curr.parentNode.childNodes;
    var next = getVerticalElem(nodes, curr, dir);
    next.childNodes[4].focus();
  }

  function navGroupCellV(selected, dir) {
    var nodes = selected.parentNode.childNodes;
    var next = getVerticalElem(nodes, selected, dir);
    next.focus();
  }

  function navCellH(selected, dir) {
    var next = getHorizontalElem(cellsByRow, selected, dir);
    next.focus();
  }

  function navCellV(selected, dir) {
    var next = getVerticalElem(cellsByRow, selected, dir);
    next.focus();
  }

  function setValueOf(target, value) {
    target.value = value;
    target.setAttribute("data-no", value);
  }

  function validateValue(target, value) {
    var id = target.getAttribute("id");
    var index = parseInt(id.substr(5));
    setValueOf(target, value);
    sendAck("validate-value", index, value, function(err) {
      if (err) {
        target.classList.add("invalid-value");
        setValueOf(target, null);
        setTimeout(function() {
          target.classList.remove("invalid-value");
        }, 500);
      } else {
        target.classList.add("solved");
      }
    });
  }

  function showCellSelectPane(selected) {
    var group = selected.parentNode;
    var pane = find("#cell-select-pane");
    var cell;

    if (pane == null) {
      pane = elem("div");
      pane.setAttribute("id", "cell-select-pane");
      pane.className = "group pane";
      for (var i = 0; i < 9; i++) {
        cell = elem("div");
        cell.className = "pane-cell cell";
        cell.setAttribute("data-no", i + 1);
        pane.appendChild(cell);
      }
      find("body").appendChild(pane);
    }

    pane.style.left = group.offsetLeft + "px";
    pane.style.top = group.offsetTop + "px";
    pane.style.display = "";

    pane["pane-target"] = selected;
  }

  subscribe("init-round", function(graph) {
    var cell;

    for (var key in graph.board) {
      cell = find("#cell-" + key);
      cell.className += " solved";
      setValueOf(cell, graph.board[key]);
    }

    find("input:nth-child(5)").focus();
  });

  on(window, "mousedown", function(e) {
    var t = e.target;

    if (/cell/.test(t.className)) {
      showCellSelectPane(t);
      e.preventDefault();
      return true;
    }

  });

  on(window, "mouseup", function(e) {
    var t = e.target;
    var pane = find("#cell-select-pane");
    var panetarget;
    var index;

    if (/pane-cell/.test(t.className)) {
      panetarget = t.parentNode["pane-target"];
      validateValue(panetarget, parseInt(t.getAttribute("data-no")));
    }

    pane && (pane.style.display = "none");
  });

  on(window, "keydown", function(e) {
    var t = e.target;
    var which = e.which || e.keyCode;

    if (/cell/.test(t.className)) {
      // Target element is an input element.

      if (e.metaKey || e.ctrlKey || e.altKey || which == 9) {
        // Ignore META, ALT, CTRL and TAB. We do not want to hook
        // any browser-default shortcuts.

        return false;
      }

      if (which >= 48 && which <= 57) {
        // Keycode 48-57 represents 0 to 9. This values are allowed. Ignore
        // if target is already solved.

        if (/solved/.test(t.className) == false) {
          validateValue(t, which - 48);
        }

        e.preventDefault();
        return true;
      }

      switch (which) {

        case 65: // <a>-key pressed
          e.shiftKey ? navGroupH(t, -1) : navGroupCellH(t, -1);
          e.preventDefault();
          return true;

        case 68: // <d>-key pressed
          e.shiftKey ? navGroupH(t, 1) : navGroupCellH(t, 1);
          e.preventDefault();
          return true;

        case 83: // <s>-key pressed
          e.shiftKey ? navGroupV(t, 1) : navGroupCellV(t, 1);
          e.preventDefault();
          return true;

        case 87: // <w>-key pressed
          e.shiftKey ? navGroupV(t, -1) : navGroupCellV(t, -1);
          e.preventDefault();
          return true;

        case 37: // Happends when the <left>-arrow is pressed.
          navCellH(t, -1);
          e.preventDefault();
          return true;

        case 38: // Happends when the <up>-arrow is pressed.
          navCellV(t, -1);
          e.preventDefault();
          return true;

        case 39: // Happends when the <right>-arrow is pressed.
          navCellH(t, 1);
          e.preventDefault();
          return true;

        case 40: // Happends when the <down>-arrow is pressed.
          navCellV(t, 1);
          e.preventDefault();
          return true;

        // By default, ignore the keystroke. We do not allow any
        // other values then numbers.
        default:
          e.preventDefault();
          return false;
      }
    }

  });


})(window.speeduko || (window.speeduko = {}));