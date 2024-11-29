import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";
import axios from "axios";
import {
  AWS_REGION,
  accessKeyId,
  secretAccessKey,
  BUCKET_NAME,
} from "../config/index.js";

export const s3 = new S3Client({
  AWS_REGION,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

export const uploadImageToS3 = async (imageUrl, tweetId) => {
  if (!imageUrl) return null;

  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" }); // Get the image as a stream
    const extension = path.extname(imageUrl);
    const fileName = `${tweetId}${extension}`;

    console.log("buffer", response.data);

    console.log("Resp", BUCKET_NAME, AWS_REGION);
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: response.data,
      ContentType: response.headers["content-type"],
    };

    await s3.send(new PutObjectCommand(uploadParams));

    // Construct the S3 URL
    return `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error(
      `Error uploading image from ${imageUrl} for tweet ${tweetId}:`,
      error.message
    );
    return null;
  }
};
