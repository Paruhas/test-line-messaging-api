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
const { isArray } = require("./libs/Validator");

const {
  line_verifyingLineSignatures,
  line_getProfileFromLineUserId,
  line_botPostMessageReply,
  line_botPushMessage,
  line_botLeaveFromChat,
  line_botGetChatInfo,
  line_botGetOneChatMemberInfo,
  lineBot_handlerWhenJoinGroup,
  lineBot_handlerWhenResponseForBooking,
} = require("./utils/line_service");
const { tryJSONparse } = require("./libs/tryJson");

/* ===== LOG ===== */
app.use(requestLoggerMiddleware);

/* ===== GOOGLE CLOUD STORAGE ===== */

/* ===== HOMEPAGE ===== */
app.get("/", homeMiddleware);

/* ===== API HOOK ===== */
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

    if (bodyEvents.length > 1) {
      throw new CustomError(
        400,
        "7880",
        `BOT cannot handle events.length > 1.`
      );
    }

    const events = (bodyEvents && bodyEvents[0]) || null;
    if (!events) {
      throw new CustomError(400, "7880", `No events found.`);
    }

    const eventsType = events.type || null;
    const messageType = (events.message && events.message.type) || null;
    const messageText = (events.message && events.message.text) || null;
    const sourceType = (events.source && events.source.type) || null;
    const sourceRoomId = (events.source && events.source.roomId) || null;
    const sourceGroupId = (events.source && events.source.groupId) || null;
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

    if (!["message", "leave", "join"].includes(eventsType)) {
      throw new CustomError(400, "7880", `Not operate eventsType.`);
    }
    if (eventsType === "message" && messageType !== "text") {
      throw new CustomError(400, "7880", `Not operate messageType.`);
    }

    const checkLineVerifyingLineSignatures = await line_verifyingLineSignatures(
      req.body,
      req.headers["x-line-signature"]
    );
    // console.log({ checkLineVerifyingLineSignatures });
    if (checkLineVerifyingLineSignatures.isError === true) {
      console.error("LINE_BOT checkLineVerifyingLineSignatures");

      throw new CustomError(
        400,
        "7880",
        checkLineVerifyingLineSignatures.message
      );
    }

    console.log({ destination });
    console.log(bodyEvents); // events from API_LINE

    /* === VALIDATE === */
    /* === FLOW _ SKIP SOME eventsType === */
    if (eventsType === "leave" && sourceType !== "group") {
      return res.status(200).json({});
    }

    /* === VALIDATE === */
    /* === FLOW _ HOOK SOURCE_TYPE != GROUP === */
    // REPLY & IF sourceType = 'room' => LEAVE
    if (eventsType !== "leave" && sourceType && sourceType !== "group") {
      const postMessageReply = await line_botPostMessageReply(replyToken, [
        {
          type: "text",
          text: `LINE OA ตัวนี้ทำงานแค่ในแชทกลุ่มเท่านั้น\nชวนฉันเข้ากลุ่มได้เลย`,
        },
        {
          type: "sticker",
          packageId: "446",
          stickerId: "1988",
        },
      ]);
      console.log({
        postMessageReply,
      });

      if (sourceRoomId) {
        const leaveRoom = await line_botLeaveFromChat("room", sourceRoomId);

        console.log({
          leaveRoom,
        });
      }

      return res.status(200).json({});
    }

    /* === FLOW _ LEAVE GROUP === */
    if (eventsType === "leave" && sourceType === "group") {
      try {
        const storeData = await findOneStore({
          where: {
            lineGroupId: sourceGroupId,
          },
        });
        if (storeData === undefined) {
          throw new Error("ข้อบกพร่องจากฐานข้อมูล");
        }
        if (!storeData) {
          throw new Error("ไม่พบร้านค้าที่ผูกไว้กับกลุ่มแชทนี้");
        }

        const editStoreData = await updateStore(
          {
            lineGroupId: null,
          },
          {
            where: { id: storeData.id },
            transaction: "transaction",
          }
        );
        if (editStoreData === undefined) {
          throw new Error("ข้อบกพร่องจากฐานข้อมูล");
        }
        if (!editStoreData[0]) {
          throw new Error("ไม่มีข้อมูลที่ถูกอัพเดตในฐานข้อมูล");
        }
      } catch (error) {
        console.error(error);
      }
      console.log(`--- FLOW _ LEAVE GROUP ---`);

      return res.status(200).json({});
    }

    /* === FLOW _ JOIN GROUP === */
    // CHECK & UPDATE DATABASE => REPLY
    if (eventsType === "join" && sourceType && sourceType === "group") {
      const validateJoinGroup = await lineBot_handlerWhenJoinGroup(
        sourceGroupId
      );

      const { isError, message: replayMessage } = validateJoinGroup;

      const array_messages = [
        {
          type: "text",
          text: `${replayMessage}`,
        },
      ];
      if (isError === false) {
        array_messages.push({
          type: "sticker",
          packageId: "6359",
          stickerId: "11069853",
        });
      }

      const postMessageReply = await line_botPostMessageReply(
        replyToken,
        array_messages
      );
      console.log({
        postMessageReply,
      });

      if (isError === true) {
        if (sourceGroupId) {
          const leaveGroup = await line_botLeaveFromChat(
            "group",
            sourceGroupId
          );
          console.log({
            leaveGroup,
          });
        }
      }

      console.log(`--- FLOW _ JOIN GROUP ---`);

      return res.status(200).json({});
    }

    // /* === GET PROFILE (FOLLOWER) === */
    // if (sourceUserId !== null) {
    //   const getProfile = await line_getProfileFromLineUserId(sourceUserId);
    //   console.log({ getProfile });
    //   if (getProfile.isError === true) {
    //     throw new CustomError(400, "7880", getProfile.message);
    //   }
    // }

    /* === GROUP API === */
    if (
      sourceType === "group" &&
      eventsType !== "leave" &&
      messageText.search("#BKNG") === 0
    ) {
      // const groupSummary = await line_botGetChatInfo("group", sourceGroupId);
      // console.log({ groupSummary });

      // if (sourceUserId !== null) {
      //   const groupChatMemberProfile = await line_botGetOneChatMemberInfo(
      //     "group",
      //     sourceGroupId,
      //     sourceUserId
      //   );

      //   console.log({
      //     groupChatMemberProfile,
      //   });
      // }

      if (
        eventsType === "message" &&
        messageType === "text" &&
        messageText.search("#BKNG") === 0
      ) {
        const handlerBooking = await lineBot_handlerWhenResponseForBooking(
          messageText
        );

        const { isError, message: replayMessage } = handlerBooking;

        const array_messages = [
          {
            type: "text",
            text: `${replayMessage}`,
          },
        ];
        if (isError === false) {
          array_messages.push({
            type: "sticker",
            packageId: "6359",
            stickerId: "11069857",
          });
        }

        const postMessageReply = await line_botPostMessageReply(
          replyToken,
          array_messages
        );
        console.log({
          postMessageReply,
        });
      }
    }

    // /* === REPLY MESSAGE === */
    // if (eventsType === "message") {
    //   const replayMessage = messageText || "จับค่าข้อความไม่ได้";

    //   const postReply = await axios({
    //     url: `https://api.line.me/v2/bot/message/reply`,
    //     method: "post",
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
    //     },
    //     data: {
    //       replyToken: replyToken,
    //       messages: [
    //         {
    //           type: "text",
    //           text: `ตอบค่าเดิมกลับไป ${replayMessage}`,
    //         },
    //       ],
    //     },
    //   });
    //   console.log({
    //     postReply: (postReply && postReply.data) || null,
    //   });
    // }

    return res
      .status(200)
      .json(responseFormat("0000", "success", "success.", {}));
  } catch (error) {
    console.log(error);

    next(error);
  }
});

/* ===== FOR ZOMBIE RESTART ===== */
app.get("/api/version/001", versionCheck);

/* ===== ROUTER ===== */
app.post("/line/message/push/parking", async (req, res, next) => {
  try {
    const {
      groupId,
      hashtagCode,
      uuid,
      storeName,
      name,
      telephoneNumber,
      parkingCarDescription,
      parkingCarNumber,
    } = req.body;
    let { datetime } = req.body;

    datetime = dayjs(datetime).tz("Asia/Bangkok").format("DD-MM-YYYY HH:mm:ss");

    const text = `#${hashtagCode},\norderId:${uuid},\nร้านค้า:${storeName},\nชื่อผู้จอง:${name},\nเบอร์ติดต่อ:${telephoneNumber},\nลักษณะรถ:${parkingCarDescription},\nเลขทะเบียนรถ:${parkingCarNumber},\nวันและเวลาจอง:${datetime},`;

    const messagesArray = [
      {
        type: "text",
        text: `${text}`,
      },
    ];

    const pushMessage = await line_botPushMessage(groupId, messagesArray);
    console.log({
      pushMessage: pushMessage,
    });

    return res
      .status(200)
      .json(responseFormat("0000", "success", "success.", {}));
  } catch (error) {
    next(error);
  }
});

app.post("/line/message/push/seating", async (req, res, next) => {
  try {
    const {
      groupId,
      hashtagCode,
      uuid,
      storeName,
      name,
      telephoneNumber,
      seatingMember,
    } = req.body;
    let { datetime } = req.body;

    datetime = dayjs(datetime).tz("Asia/Bangkok").format("DD-MM-YYYY HH:mm:ss");

    const text = `#${hashtagCode},\norderId:${uuid},\nร้านค้า:${storeName},\nชื่อผู้จอง:${name},\nเบอร์ติดต่อ:${telephoneNumber},\nจำนวนคน:${seatingMember},\nวันและเวลาจอง:${datetime},`;

    const messagesArray = [
      {
        type: "text",
        text: `${text}`,
      },
    ];

    const pushMessage = await line_botPushMessage(groupId, messagesArray);
    console.log({
      pushMessage: pushMessage,
    });

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
