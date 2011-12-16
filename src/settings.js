(function(app) {

  // Module namespace
  var exports = app.settings = {};


  // Exported functions
  exports.setNickname   = setNickname;
  exports.setEmail      = setEmail;
  exports.getEmailHash  = getEmailHash;
  exports.getImageUrl   = getImageUrl;
  exports.getNickname   = getNickname;
  exports.getEmail      = getEmail;


  // Internal constants
  var GRAVATAR_URL      = "http://www.gravatar.com/avatar/";



  function setNickname(value) {
    localStorage.setItem("nickname", value);
  }


  function setEmail(value) {
    localStorage.setItem("email", value);
  }


  function getEmail() {
    return localStorage.getItem("email");
  }


  function getNickname() {
    return localStorage.getItem("nickname");
  }


  function getEmailHash(value) {
    return MD5(value || localStorage.getItem("email"));
  }


  function getImageUrl(email) {
    return GRAVATAR_URL + getEmailHash(email);
  }


})(window.speeduko || (window.speeduko = {}));