const isProduction = process.env.NODE_ENV === "production";

class CustomError extends Error {
  constructor(httpStatusCode, resErrorCode, message) {
    super(message);
    this.resErrorCode = resErrorCode;
    this.httpStatusCode = httpStatusCode;
  }
}

const ErrorFormat = (error) => {
  const devError = {
    res_code: error.resErrorCode || "7880",
    res_type: "error",
    res_stack: error.stack || "",
    res_message: error.message || "",
    res_data: {},
  };
  const prodError = {
    res_code: error.resErrorCode || "7880",
    res_message: "Server error.",
    res_data: {},
  };

  return {
    devError,
    prodError,
  };
};

const ErrorService = (error) => {
  const { devError, prodError } = ErrorFormat(error);

  const resError = isProduction ? prodError : devError;
  return resError;
};

module.exports = { CustomError, ErrorService };
