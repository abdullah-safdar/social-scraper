import mongoose from "mongoose";

const tweetSchema = new mongoose.Schema(
  {
    account: String,
    tweet_id: String,
    created_at: Date,
    text: String,
    image_url: String,
    s3_image_url: String,
    last_cron_date: Date,
    tweet_link: String,
  },
  { timestamps: true }
);
const Tweet = mongoose.model("Tweet", tweetSchema);

export default Tweet;
