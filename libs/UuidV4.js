const { v4: uuidv4 } = require("uuid");

function generateUUID(key = "", underscore = true, dashed = true) {
  let uuid = uuidv4();

  key = key + (underscore === true ? "_" : "");

  if (dashed === false) {
    uuid = uuid.replaceAll("-", "");
  }

  key = key + uuid;

  return key;
}

module.exports = { generateUUID };
