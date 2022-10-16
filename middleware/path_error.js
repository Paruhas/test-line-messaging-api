const { responseFormat } = require("../utils/response_service.js");

module.exports = (req, res, next) => {
  return res
    .status(404)
    .json(responseFormat("7880", "error", "Path not found.", {}));
};
