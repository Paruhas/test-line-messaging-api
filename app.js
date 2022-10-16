require("dotenv").config();

const cors = require("cors");
const compression = require("compression");
const express = require("express");

const app = express();

const PORT = process.env.PORT || 11001;
const NODE_ENV = process.env.NODE_ENV || "local";
console.log({ NODE_ENV });

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const requestLoggerMiddleware = require("./middleware/req_log");
const homeMiddleware = require("./middleware/home.js");
const versionCheck = require("./middleware/version_check.js");
const errorMiddleware = require("./middleware/error.js");
const pathErrorMiddleware = require("./middleware/path_error.js");
const { responseFormat } = require("./utils/response_service");
const { CustomError } = require("./utils/error_service");

const dayjs = require("./libs/Day");
const axios = require("axios");
const { createHmac } = require("node:crypto");

/* ===== LOG ===== */
app.use(requestLoggerMiddleware);

/* ===== GOOGLE CLOUD STORAGE ===== */

/* ===== HOMEPAGE ===== */
app.get("/", homeMiddleware);

/* ===== API HOOK ===== */

/* ===== FOR ZOMBIE RESTART ===== */
app.get("/api/version/001", versionCheck);

async function LINE_verifyingLineSignatures(reqBody, lindSignatures) {
  const res = {
    isError: true,
    message: "",
    data: {},
  };

  try {
    if (!reqBody) {
      throw new Error("No parameter reqBody.");
    }
    if (!lindSignatures) {
      throw new Error("No parameter lindSignatures.");
    }

    const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

    if (!LINE_CHANNEL_SECRET) {
      throw new Error("No LINE_CHANNEL_SECRET found.");
    }

    const text = JSON.stringify(reqBody);

    const signature = createHmac("SHA256", LINE_CHANNEL_SECRET)
      .update(text)
      .digest("base64")
      .toString();

    if (signature !== lindSignatures) {
      throw new Error("lindSignatures Unauthorized.");
    }

    res.message = "success.";
    res.isError = false;
  } catch (error) {
    res.message = error.message;
    res.isError = true;
  }

  return res;
}

async function LINE_getProfileFromLineUserId(lindUserId) {
  const res = {
    isError: true,
    message: "",
    data: {},
  };

  try {
    if (!lindUserId) {
      throw new Error("No parameter lineUserId.");
    }

    const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

    if (!LINE_ACCESS_TOKEN) {
      throw new Error("No LINE_ACCESS_TOKEN found.");
    }

    const getProfile = await axios({
      url: `https://api.line.me/v2/bot/profile/${lindUserId}`,
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
      },
    });

    res.data = getProfile.data;
    res.message = "success.";
    res.isError = false;
  } catch (error) {
    res.message = error.message;
    res.isError = true;
  }

  return res;
}

/* ===== ROUTER ===== */
app.post("/line/hook", async (req, res, next) => {
  try {
    if (!req.body) {
      throw new CustomError(400, "7880", "req.body not found.");
    }

    const { destination, events: bodyEvents } = req.body;

    if (!req.headers) {
      throw new CustomError(400, "7880", `req.header not found.`);
    }
    if (req.headers && !req.headers["x-line-signature"]) {
      throw new CustomError(
        400,
        "7880",
        `req.headers["x-line-signature"] not found.`
      );
    }

    const events = (bodyEvents && bodyEvents[0]) || null;
    if (!events) {
      throw new CustomError(400, "7880", `No events found.`);
    }

    const eventsType = events.type || null;
    const messageText = (events.message && events.message.text) || null;
    const sourceType = (events.source && events.source.type) || null;
    const sourceRoomId = (events.source && events.source.roomId) || null;
    const sourceUserId = (events.source && events.source.userId) || null;
    const replyToken = events.replyToken;

    if (!eventsType) {
      throw new CustomError(400, "7880", `No eventsType found.`);
    }

    const LINE_OriginalType = [
      "unfollow",
      "follow",
      "message",
      "leave",
      "join",
    ];
    const LINE_MESSAGE_OriginalType = [
      "text",
      "sticker",
      "image",
      "video",
      "audio",
      "location",
      "imagemap",
      "template",
      "flex",
    ];
    const LINE_SOURCE_OriginalType = [
      "user", // คุยกับ LINE OA
      "room", // LINE OA ถูกคุย ใน ห้องแชท
      "group", // LINE OA ถูกคุย ใน กลุ่มแชท
    ];

    if (["unfollow"].includes(eventsType)) {
      throw new CustomError(400, "7880", `Not operate eventsType.`);
    }

    const checkLINE_VerifyingLineSignatures =
      await LINE_verifyingLineSignatures(
        req.body,
        req.headers["x-line-signature"]
      );
    console.log({ checkLINE_VerifyingLineSignatures });
    if (checkLINE_VerifyingLineSignatures.isError === true) {
      throw new CustomError(
        400,
        "7880",
        checkLINE_VerifyingLineSignatures.message
      );
    }

    console.log({ destination });
    console.log(bodyEvents); // events from API_LINE

    if (eventsType === "leave") {
      return res.status(200);
    }

    if (
      // eventsType === "join" &&
      sourceType &&
      sourceType !== "group"
    ) {
      const postReply = await axios({
        url: `https://api.line.me/v2/bot/message/reply`,
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
        },
        data: {
          replyToken: replyToken,
          messages: [
            {
              type: "text",
              text: `ไม่ใช่กลุ่มแชท Line ที่ถูกต้อง หรือ / ค้นหาชื่อกลุ่ม Line ร้านค้าไม่พบ หรือ ไม่ตรงกับในระบบ`,
            },
          ],
        },
      });
      console.log({
        postReply: (postReply && postReply.data) || null,
      });

      const leaveRoom = await axios({
        url: `https://api.line.me/v2/bot/room/${sourceRoomId}/leave`,
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
        },
        data: {},
      });

      console.log({
        leaveRoom: (leaveRoom && leaveRoom.data) || null,
      });

      return res.status(200);
    }

    /* === GET PROFILE (FOLLOWER) === */
    if (sourceUserId !== null) {
      const getProfile = await LINE_getProfileFromLineUserId(sourceUserId);
      console.log({ getProfile });
      if (getProfile.isError === true) {
        throw new CustomError(400, "7880", getProfile.message);
      }
    }

    /* === GROUP API === */
    if (sourceType === "group" && eventsType !== "leave") {
      const sourceGroupId = events.source.groupId;

      const groupSummary = await axios({
        url: `https://api.line.me/v2/bot/group/${sourceGroupId}/summary`,
        method: "get",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
        },
        data: {},
      });

      console.log({
        groupSummary: (groupSummary && groupSummary.data) || null,
      });

      // const userId = (events.source && events.source.userId) || null;

      if (sourceUserId !== null) {
        const groupChatMemberProfile = await axios({
          url: `https://api.line.me/v2/bot/group/${sourceGroupId}/member/${sourceUserId}`,
          method: "get",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
          },
          data: {},
        });

        console.log({
          groupChatMemberProfile:
            (groupChatMemberProfile && groupChatMemberProfile.data) || null,
        });
      }
    }

    /* === REPLY MESSAGE === */
    if (eventsType === "message") {
      const replayMessage = messageText || "จับค่าข้อความไม่ได้";

      const postReply = await axios({
        url: `https://api.line.me/v2/bot/message/reply`,
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
        },
        data: {
          replyToken: replyToken,
          messages: [
            {
              type: "text",
              text: `ตอบค่าเดิมกลับไป ${replayMessage}`,
            },
          ],
        },
      });
      console.log({
        postReply: (postReply && postReply.data) || null,
      });
    }

    return res
      .status(200)
      .json(responseFormat("0000", "success", "success.", {}));
  } catch (error) {
    console.log(error);

    next(error);
  }
});

app.post("/line/post", async (req, res, next) => {
  try {
    const { to, text } = req.body;

    return res
      .status(200)
      .json(responseFormat("0000", "success", "success.", {}));
  } catch (error) {
    next(error);
  }
});

/* ===== ERROR ===== */
app.use(errorMiddleware);

/* ===== INCORRECT PATH ===== */
app.use("*", pathErrorMiddleware);

app.listen(PORT, async () => {
  try {
    console.log(
      `
  =====================================

    DB connection success
    Server is running on port: ${PORT}
    Currently running mode: ${NODE_ENV.toUpperCase()}

  =====================================
`
    );
  } catch (error) {
    console.log(
      `
    =====================================
  
      Server error on start up: ${error}
  
    =====================================
  `
    );
  }
});
