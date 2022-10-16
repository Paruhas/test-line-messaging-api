const { responseFormat } = require("../utils/response_service");

module.exports = (req, res, next) => {
  try {
    return res
      .status(200)
      .json(responseFormat("0000", "success", "VERSION CHECKED.", {}));
  } catch (error) {
    next(error);
  }
};
