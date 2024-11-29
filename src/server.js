import mongoose from "mongoose";
import cron from "node-cron";
import express from "express";
import { MONGO_URI } from "./config/index.js";
import { twitterDataCrawler } from "./services/index.js";
import router from "./routes/index.js";
import bodyParser from "body-parser";
import cors from "cors";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(cors());
app.use("/", router);

app.listen(3005, () => {
  console.log("Server is running on http://localhost:3005");
});

twitterDataCrawler().catch((error) =>
  console.error("An error occurred:", error.message)
);

//for cron job uncomment this
//cron.schedule("0 */60 * * * *", twitterDataCrawler);
