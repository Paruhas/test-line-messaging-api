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

/* ===== LOG ===== */
app.use(requestLoggerMiddleware);

/* ===== GOOGLE CLOUD STORAGE ===== */

/* ===== HOMEPAGE ===== */
app.get("/", homeMiddleware);

/* ===== API HOOK ===== */

/* ===== FOR ZOMBIE RESTART ===== */
app.get("/api/version/001", versionCheck);

async function line_verifyingLineSignatures(reqBody, lindSignatures) {
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

    const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || null;

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

async function line_getProfileFromLineUserId(lindUserId) {
  const res = {
    isError: true,
    message: "",
    data: {},
  };

  try {
    if (!lindUserId) {
      throw new Error("No parameter lineUserId.");
    }

    const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN || null;

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

async function line_botPostMessageReply(replyToken, messagesArray) {
  const res = {
    isError: true,
    message: "",
    data: {},
  };

  try {
    if (!replyToken) {
      throw new Error("No parameter replyToken.");
    }
    if (!messagesArray) {
      throw new Error("No parameter messagesArray.");
    }
    if (
      !isArray(messagesArray) ||
      (isArray(messagesArray) && messagesArray.length === 0)
    ) {
      throw new Error("messagesArray must be array.");
    }

    const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN || null;

    if (!LINE_ACCESS_TOKEN) {
      throw new Error("No LINE_ACCESS_TOKEN found.");
    }

    const postReply = await axios({
      url: `https://api.line.me/v2/bot/message/reply`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
      },
      data: {
        replyToken: replyToken,
        messages: messagesArray,
      },
    });

    res.data = postReply.data;
    res.message = "success.";
    res.isError = false;
  } catch (error) {
    res.message = error.message;
    res.isError = true;
  }

  return res;
}

async function line_botLeaveFromChat(chatType, chatId) {
  const res = {
    isError: true,
    message: "",
    data: {},
  };

  try {
    if (!chatType) {
      throw new Error("No parameter chatType.");
    }
    if (!chatId) {
      throw new Error("No parameter chatId.");
    }

    const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN || null;

    if (!LINE_ACCESS_TOKEN) {
      throw new Error("No LINE_ACCESS_TOKEN found.");
    }

    const leave = await axios({
      url: `https://api.line.me/v2/bot/${chatType}/${chatId}/leave`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
      },
      data: {},
    });

    res.data = leave.data;
    res.message = "success.";
    res.isError = false;
  } catch (error) {
    res.message = error.message;
    res.isError = true;
  }

  return res;
}

async function line_botGetChatInfo(chatType, chatId) {
  const res = {
    isError: true,
    message: "",
    data: {},
  };

  try {
    if (!chatType) {
      throw new Error("No parameter chatType.");
    }
    if (!chatId) {
      throw new Error("No parameter chatId.");
    }

    const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN || null;

    if (!LINE_ACCESS_TOKEN) {
      throw new Error("No LINE_ACCESS_TOKEN found.");
    }

    const getInfo = await axios({
      url: `https://api.line.me/v2/bot/${chatType}/${chatId}/summary`,
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
      },
      data: {},
    });

    res.data = getInfo.data;
    res.message = "success.";
    res.isError = false;
  } catch (error) {
    res.message = error.message;
    res.isError = true;
  }

  return res;
}

async function line_botGetOneChatMemberInfo(chatType, chatId, chatMemberId) {
  const res = {
    isError: true,
    message: "",
    data: {},
  };

  try {
    if (!chatType) {
      throw new Error("No parameter chatType.");
    }
    if (!chatId) {
      throw new Error("No parameter chatId.");
    }
    if (!chatMemberId) {
      throw new Error("No parameter chatMemberId.");
    }

    const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN || null;

    if (!LINE_ACCESS_TOKEN) {
      throw new Error("No LINE_ACCESS_TOKEN found.");
    }

    const getOneMemberInfo = await axios({
      url: `https://api.line.me/v2/bot/${chatType}/${chatId}/member/${chatMemberId}`,
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
      },
      data: {},
    });

    res.data = getOneMemberInfo.data;
    res.message = "success.";
    res.isError = false;
  } catch (error) {
    res.message = error.message;
    res.isError = true;
  }

  return res;
}

function tryJSONparse(JSONstring) {
  try {
    return JSON.parse(JSONstring);
  } catch (error) {
    return null;
  }
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
      let replayMessage = "ระบบดำเนินการไม่สำเร็จ";
      let isError = false;

      try {
        const groupSummary = await line_botGetChatInfo("groups", sourceGroupId);
        console.log({
          groupSummary,
        });
        if (groupSummary.isError === true) {
          throw new Error("\nดึงข้อมูลกลุ่มแชทจาก LINE API ไม่สำเร็จ");
        }

        const groupName =
          (groupSummary.data && groupSummary.data.groupName) || null;
        if (!groupName) {
          throw new Error("\nหาค่า groupName จาก LINE API ไม่พบ");
        }

        const storeData = await findOneStore({
          where: {
            lineGroupId: sourceGroupId,
          },
        });
        if (storeData === undefined) {
          throw new Error("\nข้อบกพร่องจากฐานข้อมูล");
        }
        if (!storeData) {
          throw new Error("\nชื่อแชทกลุ่ม ไม่ตรงกับชื่อร้านค้าในระบบ");
        }
        if (storeData && storeData.lineGroupId !== null) {
          throw new Error("\nแชทกลุ่มนี้มีค่าอยู่แล้วในฐานข้อมูล");
        }

        const editStoreData = await updateStore(
          {
            lineGroupId: sourceGroupId,
          },
          {
            where: { id: storeData.id },
            transaction: "transaction",
          }
        );
        if (editStoreData === undefined) {
          throw new Error("\nข้อบกพร่องจากฐานข้อมูล");
        }
        if (!editStoreData[0]) {
          throw new Error("\nไม่มีข้อมูลที่ถูกอัพเดตในฐานข้อมูล");
        }

        replayMessage = "สวัสดี\nระบบทำการลงทะเบียนแชทกลุ่มร้านเสร็จสิ้นแล้ว";
      } catch (error) {
        replayMessage = replayMessage + error.message;
        isError = true;
      }

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
        let replayMessage = "ระบบการจอง(BKNG) ไม่สำเร็จ";
        let isError = false;

        try {
          let textToJson = messageText.replaceAll("\n", "");
          textToJson = textToJson.replaceAll(",", `","`);
          textToJson = textToJson.replaceAll(":", `":"`);
          textToJson = textToJson.replaceAll("#", `hashtagCode":"`);
          textToJson = `{"` + textToJson;
          textToJson = textToJson.slice(0, textToJson.length - 3);
          textToJson = textToJson + `"}`;

          console.log({ textToJson });

          const textObject = tryJSONparse(textToJson);

          console.log({ textObject });

          if (textObject === null) {
            throw new Error("รูปแบบการพิมพ์ไม่ตรงกับที่กำหนดไว้");
          }
          const {
            hashtagCode,
            orderId: bookingUuid,
            ชื่อผู้จอง: bookerName,
            โต๊ะ: bookingSeatingListName,
            ที่จอดรถ: bookingParkingListName,
            สถานะ: bookingStatus,
          } = textObject;

          if (bookingStatus !== "confirm" && bookingStatus !== "reject") {
            throw new Error("สถานะ ไม่ถูกต้องตามรูปแบบการพิมพ์ที่กำหนดไว้");
          }

          if (bookingUuid.search("BK") !== 0) {
            throw new Error("orderId ไม่ถูกต้องตามรูปแบบการพิมพ์ที่กำหนดไว้");
          }

          let bookingTypeName;
          switch (hashtagCode) {
            case "BKNG0001":
              bookingTypeName = "seating";
              break;

            case "BKNG0002":
              bookingTypeName = "parking";
              break;

            default:
              throw new Error("# ไม่ถูกต้องตามรูปแบบการพิมพ์ที่กำหนดไว้");
              break;
          }

          if (
            bookingTypeName === "seating" &&
            bookingStatus === "confirm" &&
            !bookingSeatingListName
          ) {
            throw new Error("โต๊ะ ไม่ถูกต้องตามรูปแบบการพิมพ์ที่กำหนดไว้");
          }

          if (bookingTypeName === "seating") {
            try {
              const newBookingStatus = bookingStatus;
              const newBookingSeatingListName = bookingSeatingListName || null;

              // const [storeData, bookingData] = await Promise.all([
              //   findOneStore({
              //     where: {
              //       lineGroupId: sourceGroupId,
              //     },
              //   }),
              //   findOneBooking({
              //     where: {
              //       uuid: bookingUuid,
              //       bookingTypeName: bookingTypeName,
              //       status: "pending",
              //       deleted: false,
              //     },
              //     raw: true,
              //   }),
              // ]);
              // if (storeData === undefined) {
              //   throw new Error("database error (findOneStore).");
              // }
              // if (!storeData) {
              //   throw new Error("9001");
              // }
              // if (bookingData === undefined) {
              //   throw new Error("database error (findOneBooking).");
              // }
              // if (!bookingData) {
              //   throw new Error("9002");
              // }
              // if (storeData.id !== bookingData.storeId) {
              //   throw new Error("9003");
              // }

              // const oldBookingStatus = bookingData.status;
              // const oldBookingSeatingListName = bookingData.seatingListName;

              // const [editBookingData, createNewLogBooking] = await Promise.all([
              //   updateBooking(
              //     {
              //       seatingListName: newBookingSeatingListName,
              //       status: newBookingStatus,
              //     },
              //     {
              //       where: {
              //         uuid: bookingData.uuid,
              //         status: oldBookingStatus,
              //         deleted: false,
              //       },
              //       transaction,
              //     }
              //   ),
              //   createLogBooking(
              //     {
              //       editorRole: "system",
              //       editorId: null,
              //       editorUuid: null,
              //       editorIdNumber: null,
              //       editorFirstName: "LINE_BOT",
              //       editorLastName: null,
              //       editorEmail: null,
              //       type: "edit",
              //       createdId: null,
              //       createdUuid: null,
              //       createdUserId: null,
              //       createdUserUuid: null,
              //       createdUserIdNumber: null,
              //       createdUserLineAddId: null,
              //       createdUserFirstName: null,
              //       createdUserLastName: null,
              //       createdUserTelephoneNumber: null,
              //       createdUserEmail: null,
              //       createdStoreId: null,
              //       createdStoreUuid: null,
              //       createdStoreName: null,
              //       createdStoreTelephoneNumber: null,
              //       createdName: null,
              //       createdTelephoneNumber: null,
              //       createdDate: null,
              //       createdTime: null,
              //       createdDatetime: null,
              //       createdStatus: null,
              //       createdBookingTypeName: null,
              //       createdSeatingListName: null,
              //       createdSeatingMember: null,
              //       createdParkingListName: null,
              //       createdParkingCarNumber: null,
              //       createdParkingCarDescription: null,
              //       editType: "status",
              //       editedId: bookingData.id,
              //       editedUuid: bookingData.uuid,
              //       editedUserId: bookingData.userId,
              //       editedUserUuid: bookingData.userUuid,
              //       editedUserIdNumber: bookingData.userIdNumber,
              //       editedUserLineAddId: bookingData.userLineAddId,
              //       editedUserFirstName: bookingData.userFirstName,
              //       editedUserLastName: bookingData.userLastName,
              //       editedUserTelephoneNumber: bookingData.userTelephoneNumber,
              //       editedUserEmail: bookingData.userEmail,
              //       editedStoreId: bookingData.storeId,
              //       editedStoreUuid: bookingData.storeUuid,
              //       editedStoreName: bookingData.storeName,
              //       editedStoreTelephoneNumber:
              //         bookingData.storeTelephoneNumber,
              //       editedName: bookingData.name,
              //       editedTelephoneNumber: bookingData.telephoneNumber,
              //       editedDate: bookingData.date,
              //       editedTime: bookingData.time,
              //       editedDatetime: bookingData.datetime,
              //       editedBookingTypeName: bookingData.bookingTypeName,
              //       editedSeatingMember: bookingData.seatingMember,
              //       editedParkingCarNumber: bookingData.parkingCarNumber,
              //       editedParkingCarDescription:
              //         bookingData.parkingCarDescription,
              //       editedBeforeStatus: oldBookingStatus,
              //       editedBeforeSeatingListName: oldBookingSeatingListName,
              //       editedBeforeParkingListName: null,
              //       editedAfterStatus: newBookingStatus,
              //       editedAfterSeatingListName: newBookingSeatingListName,
              //       editedAfterParkingListName: null,
              //     },
              //     {
              //       transaction,
              //     }
              //   ),
              // ]);
              // if (editBookingData === undefined) {
              //   throw new Error("database error (updateBooking).");
              // }
              // if (!editBookingData[0]) {
              //   throw new Error("update fail (updateBooking).");
              // }
              // if (createNewLogBooking === undefined) {
              //   throw new Error("database error (createLogBooking).");
              // }
              // if (!createNewLogBooking) {
              //   throw new Error("create fail (createLogBooking).");
              // }
            } catch (error) {
              const errorMessage = "ข้อผิดพลาดจากฐานข้อมูล";
              if (error && error.message === "9001") {
                errorMessage = "ไม่พบร้านค้าที่ทำการผูกกับแชทกลุ่มนี้ในระบบ";
              }
              if (error && error.message === "9002") {
                errorMessage =
                  "ไม่พบรายการจองนี้ในระบบ หรือ ได้รับการอัพเดตสถานะไปแล้ว";
              }
              if (error && error.message === "9003") {
                errorMessage =
                  "ร้านค้าของกลุ่มแชทนี้ ไม่ใช้เจ้าของ orderId การจองนี้";
              }
              throw new Error(errorMessage);
            }
          }
          if (bookingTypeName === "parking") {
            try {
              const newBookingStatus = bookingStatus;
              const newBookingParkingListName = bookingParkingListName || null;

              // const [storeData, bookingData] = await Promise.all([
              //   findOneStore({
              //     where: {
              //       lineGroupId: sourceGroupId,
              //     },
              //   }),
              //   findOneBooking({
              //     where: {
              //       uuid: bookingUuid,
              //       bookingTypeName: bookingTypeName,
              //       status: "pending",
              //       deleted: false,
              //     },
              //     raw: true,
              //   }),
              // ]);
              // if (storeData === undefined) {
              //   throw new Error("database error (findOneStore).");
              // }
              // if (!storeData) {
              //   throw new Error("9001");
              // }
              // if (bookingData === undefined) {
              //   throw new Error("database error (findOneBooking).");
              // }
              // if (!bookingData) {
              //   throw new Error("9002");
              // }
              // if (storeData.id !== bookingData.storeId) {
              //   throw new Error("9003");
              // }

              // const oldBookingStatus = bookingData.status;
              // const oldBookingParkingListName = bookingData.parkingListName;

              // const [editBookingData, createNewLogBooking] = await Promise.all([
              //   updateBooking(
              //     {
              //       parkingListName: newBookingParkingListName,
              //       status: newBookingStatus,
              //     },
              //     {
              //       where: {
              //         uuid: bookingData.uuid,
              //         status: oldBookingStatus,
              //         deleted: false,
              //       },
              //       transaction,
              //     }
              //   ),
              //   createLogBooking(
              //     {
              //       editorRole: "system",
              //       editorId: null,
              //       editorUuid: null,
              //       editorIdNumber: null,
              //       editorFirstName: "LINE_BOT",
              //       editorLastName: null,
              //       editorEmail: null,
              //       type: "edit",
              //       createdId: null,
              //       createdUuid: null,
              //       createdUserId: null,
              //       createdUserUuid: null,
              //       createdUserIdNumber: null,
              //       createdUserLineAddId: null,
              //       createdUserFirstName: null,
              //       createdUserLastName: null,
              //       createdUserTelephoneNumber: null,
              //       createdUserEmail: null,
              //       createdStoreId: null,
              //       createdStoreUuid: null,
              //       createdStoreName: null,
              //       createdStoreTelephoneNumber: null,
              //       createdName: null,
              //       createdTelephoneNumber: null,
              //       createdDate: null,
              //       createdTime: null,
              //       createdDatetime: null,
              //       createdStatus: null,
              //       createdBookingTypeName: null,
              //       createdSeatingListName: null,
              //       createdSeatingMember: null,
              //       createdParkingListName: null,
              //       createdParkingCarNumber: null,
              //       createdParkingCarDescription: null,
              //       editType: "status",
              //       editedId: bookingData.id,
              //       editedUuid: bookingData.uuid,
              //       editedUserId: bookingData.userId,
              //       editedUserUuid: bookingData.userUuid,
              //       editedUserIdNumber: bookingData.userIdNumber,
              //       editedUserLineAddId: bookingData.userLineAddId,
              //       editedUserFirstName: bookingData.userFirstName,
              //       editedUserLastName: bookingData.userLastName,
              //       editedUserTelephoneNumber: bookingData.userTelephoneNumber,
              //       editedUserEmail: bookingData.userEmail,
              //       editedStoreId: bookingData.storeId,
              //       editedStoreUuid: bookingData.storeUuid,
              //       editedStoreName: bookingData.storeName,
              //       editedStoreTelephoneNumber:
              //         bookingData.storeTelephoneNumber,
              //       editedName: bookingData.name,
              //       editedTelephoneNumber: bookingData.telephoneNumber,
              //       editedDate: bookingData.date,
              //       editedTime: bookingData.time,
              //       editedDatetime: bookingData.datetime,
              //       editedBookingTypeName: bookingData.bookingTypeName,
              //       editedSeatingMember: bookingData.seatingMember,
              //       editedParkingCarNumber: bookingData.parkingCarNumber,
              //       editedParkingCarDescription:
              //         bookingData.parkingCarDescription,
              //       editedBeforeStatus: oldBookingStatus,
              //       editedBeforeSeatingListName: null,
              //       editedBeforeParkingListName: oldBookingParkingListName,
              //       editedAfterStatus: newBookingStatus,
              //       editedAfterSeatingListName: null,
              //       editedAfterParkingListName: newBookingParkingListName,
              //     },
              //     {
              //       transaction,
              //     }
              //   ),
              // ]);
              // if (editBookingData === undefined) {
              //   throw new Error("database error (updateBooking).");
              // }
              // if (!editBookingData[0]) {
              //   throw new Error("update fail (updateBooking).");
              // }
              // if (createNewLogBooking === undefined) {
              //   throw new Error("database error (createLogBooking).");
              // }
              // if (!createNewLogBooking) {
              //   throw new Error("create fail (createLogBooking).");
              // }
            } catch (error) {
              const errorMessage = "ข้อผิดพลาดจากฐานข้อมูล";
              if (error && error.message === "9001") {
                errorMessage = "ไม่พบร้านค้าที่ทำการผูกกับแชทกลุ่มนี้ในระบบ";
              }
              if (error && error.message === "9002") {
                errorMessage =
                  "ไม่พบรายการจองนี้ในระบบ หรือ ได้รับการอัพเดตสถานะไปแล้ว";
              }
              if (error && error.message === "9003") {
                errorMessage =
                  "ร้านค้าของกลุ่มแชทนี้ ไม่ใช้เจ้าของ orderId การจองนี้";
              }
              throw new Error(errorMessage);
            }
          }

          replayMessage = "ระบบการจอง(BKNG) สำเร็จ";
        } catch (error) {
          replayMessage = replayMessage + "\n" + error.message;
          isError = true;
        }

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

    const postMessage = await axios({
      url: `https://api.line.me/v2/bot/message/push`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
      },
      data: {
        to: groupId,
        messages: [
          {
            type: "text",
            text: `${text}`,
          },
        ],
      },
    });
    console.log({
      postMessage: (postMessage && postMessage.data) || null,
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

    const postMessage = await axios({
      url: `https://api.line.me/v2/bot/message/push`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
      },
      data: {
        to: groupId,
        messages: [
          {
            type: "text",
            text: `${text}`,
          },
        ],
      },
    });
    console.log({
      postMessage: (postMessage && postMessage.data) || null,
      postMessage_status: (postMessage && postMessage.status) || null,
      postMessage_headers: (postMessage && postMessage.headers) || null,
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
