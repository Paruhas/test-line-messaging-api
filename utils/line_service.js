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

async function line_botPushMessage(toId, messagesArray) {
  const res = {
    isError: true,
    message: "",
    data: {},
  };

  try {
    if (!toId) {
      throw new Error("No parameter toId.");
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

    const pushMessage = await axios({
      url: `https://api.line.me/v2/bot/message/push`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
      },
      data: {
        to: toId,
        messages: messagesArray,
      },
    });

    res.data = pushMessage.data;
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

async function lineBot_handlerWhenJoinGroup(sourceGroupId) {
  const res = {
    isError: true,
    message: "",
    data: {},
  };

  try {
    if (!sourceGroupId) {
      throw new Error("ข้อผิดพลาดจาก LINE API ไม่พบ id ของกลุ่มแชท");
    }

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
        name: groupName,
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

    res.isError = false;
    res.message = "สวัสดี\nระบบทำการลงทะเบียนแชทกลุ่มร้านเสร็จสิ้นแล้ว";
  } catch (error) {
    res.isError = true;
    res.message = "ระบบดำเนินการไม่สำเร็จ\n" + error.message;
  }

  return res;
}

async function lineBot_handlerWhenResponseForBooking(messageText) {
  const res = {
    isError: true,
    message: "",
    data: {},
  };

  try {
    if (!messageText) {
      throw new Error("ข้อผิดพลาดจาก LINE API ไม่พบ messageText");
    }

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

    // const newBookingStatus = bookingStatus;
    // const newBookingSeatingListName = bookingSeatingListName || null;
    // const newBookingParkingListName = bookingParkingListName || null;

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
    //   throw new Error("ข้อผิดพลาดจากฐานข้อมูล (findOneStore).");
    // }
    // if (!storeData) {
    //   throw new Error("ไม่พบร้านค้าที่ทำการผูกกับแชทกลุ่มนี้ในระบบ");
    // }
    // if (bookingData === undefined) {
    //   throw new Error("ข้อผิดพลาดจากฐานข้อมูล (findOneBooking).");
    // }
    // if (!bookingData) {
    //   throw new Error(
    //     "ไม่พบรายการจองนี้ในระบบ หรือ ได้รับการอัพเดตสถานะไปแล้ว"
    //   );
    // }
    // if (storeData.id !== bookingData.storeId) {
    //   throw new Error("ร้านค้าของกลุ่มแชทนี้ ไม่ใช้เจ้าของ orderId การจองนี้");
    // }

    // const oldBookingStatus = bookingData.status;
    // const oldBookingSeatingListName = bookingData.seatingListName;
    // const oldBookingParkingListName = bookingData.parkingListName;

    // const [editBookingData, createNewLogBooking] = await Promise.all([
    //   updateBooking(
    //     {
    //       status: newBookingStatus,
    //       seatingListName: newBookingSeatingListName,
    //       parkingListName: newBookingParkingListName,
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
    //       editedStoreTelephoneNumber: bookingData.storeTelephoneNumber,
    //       editedName: bookingData.name,
    //       editedTelephoneNumber: bookingData.telephoneNumber,
    //       editedDate: bookingData.date,
    //       editedTime: bookingData.time,
    //       editedDatetime: bookingData.datetime,
    //       editedBookingTypeName: bookingData.bookingTypeName,
    //       editedSeatingMember: bookingData.seatingMember,
    //       editedParkingCarNumber: bookingData.parkingCarNumber,
    //       editedParkingCarDescription: bookingData.parkingCarDescription,
    //       editedBeforeStatus: oldBookingStatus,
    //       editedBeforeSeatingListName: oldBookingSeatingListName,
    //       editedBeforeParkingListName: oldBookingParkingListName,
    //       editedAfterStatus: newBookingStatus,
    //       editedAfterSeatingListName: newBookingSeatingListName,
    //       editedAfterParkingListName: newBookingParkingListName,
    //     },
    //     {
    //       transaction,
    //     }
    //   ),
    // ]);
    // if (editBookingData === undefined) {
    //   throw new Error("ข้อผิดพลาดจากฐานข้อมูล (updateBooking).");
    // }
    // if (!editBookingData[0]) {
    //   throw new Error(
    //     "ข้อผิดพลาดในการบันทึกข้อมููลลงฐานข้อมูล (updateBooking)."
    //   );
    // }
    // if (createNewLogBooking === undefined) {
    //   throw new Error("ข้อผิดพลาดจากฐานข้อมูล (createLogBooking).");
    // }
    // if (!createNewLogBooking) {
    //   throw new Error(
    //     "ข้อผิดพลาดในการบันทึกข้อมููลลงฐานข้อมูล (createLogBooking)."
    //   );
    // }

    res.isError = false;
    res.message = "ระบบการจอง(BKNG) สำเร็จ";
  } catch (error) {
    res.isError = true;
    res.message = "ระบบการจอง(BKNG) ไม่สำเร็จ\n" + error.message;
  }

  return res;
}

module.exports = {
  line_decodeToken,
  line_verifyIDToken,

  line_verifyingLineSignatures,
  line_getProfileFromLineUserId,
  line_botPostMessageReply,
  line_botPushMessage,
  line_botLeaveFromChat,
  line_botGetChatInfo,
  line_botGetOneChatMemberInfo,
  lineBot_handlerWhenJoinGroup,
  lineBot_handlerWhenResponseForBooking,
};
