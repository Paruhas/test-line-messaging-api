const isOject = (input1) => {
  return Boolean(
    input1 &&
      input1.toString() === "[object Object]" &&
      !Array.isArray(input1) &&
      input1 instanceof Object
  );
};

const isArray = (input1) => {
  return Boolean(input1 && input1 instanceof Array && Array.isArray(input1));
};

const isURL = (input1) => {
  const urlPattern =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/;
  return Boolean(!!urlPattern.test(input1));
};

const isTime = (input1) => {
  const timePattern = /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/;
  return Boolean(!!timePattern.test(input1));
};

module.exports = { isOject, isArray, isURL, isTime };
