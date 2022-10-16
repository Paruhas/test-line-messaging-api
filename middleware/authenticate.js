const { CustomError } = require("../utils/error_service");

async function basicAuth(req, res, next) {
  try {
    if (
      !req.headers.authorization ||
      req.headers.authorization.indexOf("Basic ") === -1
    ) {
      throw new CustomError(401, "7880", "Missing Basic Auth.");
    }

    const authToken = req.headers.authorization.split(" ")[1];
    const decodeAuthToken = Buffer.from(authToken, "base64").toString("ascii");
    const [username, password] = decodeAuthToken.split(":");

    if (
      username !== process.env.BASIC_AUTH_U ||
      password !== process.env.BASIC_AUTH_P
    ) {
      throw new CustomError(401, "7880", "Invalid Basic Auth.");
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  basicAuth,
};
