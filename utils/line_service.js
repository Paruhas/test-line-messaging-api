const axios = require("axios");
const { JWT_decode } = require("./jwt_service");

async function line_decodeToken(liffIdToken) {
  const result = { isError: null, data: {}, error: null };

  try {
    const decodeToken = await JWT_decode(liffIdToken);
    console.log({ line_decodeToken_decodeToken: decodeToken });

    if (decodeToken.isError === true) {
      throw new Error(`liffIdToken is invalid format ${decodeToken.error}.`);
    }

    const verifyToken = await line_verifyIDToken(
      liffIdToken,
      decodeToken.data.aud
    );

    if (verifyToken.isError === true) {
      throw new Error(`Verify liffIdToken failed, ${verifyToken.error}`);
    }
    if (verifyToken.data.sub !== decodeToken.data.sub) {
      throw new Error("Verify liffIdToken failed, token's sub not match.");
    }

    result.isError = false;
    result.data = verifyToken.data;
  } catch (error) {
    result.isError = true;
    result.error = error.message;
  }

  return result;
}

async function line_verifyIDToken(token, clientId) {
  const result = { isError: null, data: {}, error: null };

  try {
    const params = new URLSearchParams();
    params.append("id_token", token);
    params.append("client_id", clientId);
    // console.log(params);

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const decode = await axios.post(
      "https://api.line.me/oauth2/v2.1/verify",
      params,
      headers
    );
    console.log("line_verifyIDToken_decode", decode);

    result.isError = false;
    result.data = decode.data;
  } catch (error) {
    result.isError = true;
    result.error = error.message;
  }

  return result;
}

module.exports = { line_decodeToken };
