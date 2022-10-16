const dayjs = require("../libs/Day.js");

module.exports = (req, res, next) => {
  try {
    const { method, originalUrl, params, query, body } = req;

    const id = dayjs().utc().valueOf();
    const start = id;
    const date = dayjs(id).utc().format("YYYY-MM-DD HH:mm:ss:SSSZ");
    let finish = null;

    console.log(`[START]${id}|${date} >>> ${method} => ${originalUrl} : -ms`);
    console.log(
      `| params: ${JSON.stringify(params)} | query: ${JSON.stringify(
        query
      )} | body: ${JSON.stringify(body)} | `
    );

    res.on("finish", () => {
      finish = dayjs().utc().valueOf();
    });

    res.on("close", () => {
      const duration = finish - start;
      console.log(
        `[CLOSE]${id}|${date} >>> ${method} => ${originalUrl} : ${duration}ms`
      );
      console.log(
        `| params: ${JSON.stringify(params)} | query: ${JSON.stringify(
          query
        )} | body: ${JSON.stringify(body)} | `
      );
    });

    next();
  } catch (error) {
    next(error);
  }
};
