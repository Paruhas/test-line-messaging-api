const fs = require("fs");
const moment = require("moment");
const crypto = require("crypto");
const { Storage } = require("@google-cloud/storage");

const projectId = process.env.GOOGLE_PROJECT_ID,
  keyFilename = process.env.GOOGLE_KEY_FILE_NAME,
  host = process.env.GOOGLE_STORAGE_HOST,
  bucketName = process.env.GOOGLE_STORAGE_BUCKET,
  folderPath = process.env.GOOGLE_STORAGE_PATH_IMAGE,
  location = process.env.GOOGLE_STORAGE_PATH_LOCATION,
  regional = process.env.GOOGLE_STORAGE_PATH_REGIONAL,
  generateChar = (bytes = 20) => crypto.randomBytes(bytes).toString("hex");

const storage = new Storage({
  projectId: projectId,
  keyFilename: keyFilename,
});
const bucket = storage.bucket(bucketName);

exports.initGoogleBucket = async () => {
  try {
    const values = bucket
      .exists()
      .then((data) => {
        return { isError: false, data };
      })
      .catch((data) => {
        return { isError: true, data: data.errors };
      });
    values.then((v) => {
      const { isError, data } = v;
      if (isError) {
        console.log("Google_Bucket", { error: data });
        throw data;
      } else {
        const [checker] = data;
        if (!checker) bucket.create({ location, regional }).then((b) => b);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

const isBucketPathExists = async (uploadType) => {
  const dateFolder = moment().utcOffset("+07:00").format("YYYY-MM-DD");
  const generateFileName = generateChar(16);
  const savePath = `${folderPath}/${uploadType}/${dateFolder}/${generateFileName}`;
  const urlImage = `${host}/${bucketName}/${savePath}`;
  const file = bucket.file(savePath);
  return file
    .exists()
    .then((data) => {
      return { isExist: data[0], urlImage, file };
    })
    .catch((err) => {
      return { isExist: false, urlImage, file };
    });
};

exports.googleUploadImage = async (
  { type, path },
  uploadType = "profile",
  enablePublic = true
) => {
  try {
    const { isExist, urlImage, file } = await isBucketPathExists(uploadType);
    if (!isExist) {
      return new Promise((resolve, reject) => {
        fs.createReadStream(path)
          .pipe(
            file.createWriteStream({
              metadata: {
                contentType: type,
              },
            })
          )
          .on("error", async (err) => {
            reject(false);
          })
          .on("finish", async () => {
            if (enablePublic) {
              file.makePublic();
            }

            resolve(urlImage);
          });
      });
    } else {
      if (enablePublic) {
        const isPublic = await file.isPublic().then((data) => data[0]);
        if (!isPublic) await file.makePublic();
      }

      return urlImage;
    }
  } catch (err) {
    return false;
  }
};
