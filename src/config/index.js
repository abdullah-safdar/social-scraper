import dotenv from "dotenv";

dotenv.config();

export const AWS_REGION = process.env.AWS_REGION;
export const BUCKET_NAME = process.env.S3_BUCKET_NAME;
export const MONGO_URI = process.env.MONGO_URI;
export const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
export const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
export const BEARER_TOKEN = process.env.BEARER_TOKEN;
