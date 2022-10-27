function tryJSONparse(JSONstring) {
  try {
    return JSON.parse(JSONstring);
  } catch (error) {
    return null;
  }
}

module.exports = {
  tryJSONparse,
};
