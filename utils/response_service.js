const dayjs = require("../libs/Day.js");

const isProduction = process.env.NODE_ENV === "production";

function responseFormat(code, type = "error", message, data = {}) {
  try {
    let responseObject = undefined;

    switch (type) {
      case "success":
        responseObject = response_success(code, message, data);
        break;

      case "error":
        responseObject = response_error(code, message, data);
        break;

      default:
        responseObject = response_error("9999", "ERROR.", {});
        break;
    }

    if (isProduction) {
      delete responseObject.res_time;
      delete responseObject.res_type;
    }

    return responseObject;
  } catch (error) {
    throw console.error("responseFormat", error);
  }
}

function response_success(code, message, data) {
  return {
    res_code: code || "0000",
    res_type: "success",
    res_message: message,
    res_data: data,
    res_time: dayjs().utc().format(),
  };
}

function response_error(code, message = "ERROR.", data) {
  return {
    res_code: code || "7880",
    res_type: "error",
    res_message: message,
    res_data: data,
    res_time: dayjs().utc().format(),
  };
}

module.exports = { responseFormat };
