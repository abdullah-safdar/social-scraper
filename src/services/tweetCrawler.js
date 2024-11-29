import axios from "axios";
import { promises as fs } from "fs";
import path from "path";
import { sleep } from "../helper/index.js";
import Tweet from "../schema/tweet.schema.js";
import { BEARER_TOKEN } from "../config/index.js";
import { uploadImageToS3 } from "./upload.js";

async function loadData() {
  try {
    const filePath = path.resolve("accounts.json");
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading accounts.json:", error.message);
    throw new Error("Failed to load accounts data.");
  }
}

async function makeRequest(url, counter, params = {}) {
  const MAX_RETRIES = 5;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      console.log("Counter", counter.value); // Log current counter value
      counter.value += 1; // Increment the counter
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
        params: params,
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        const waitTime = error.response.headers["x-rate-limit-reset"]
          ? parseInt(error.response.headers["x-rate-limit-reset"]) * 1000 -
            Date.now()
          : 60000;
        console.log(
          `Rate limit hit. Waiting ${waitTime / 1000} seconds before retry...`
        );
        await sleep(waitTime);
        retries++;
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Max retries reached for ${url}`);
}

async function getUserId(username, counter) {
  try {
    const data = await makeRequest(
      `https://api.twitter.com/2/users/by/username/${username}`,
      counter
    );
    return data.data.id;
  } catch (error) {
    console.error(`Error fetching user ID for ${username}:`, error.message);
    return null;
  }
}

async function getRecentTweets(
  userId,
  accountName,
  sinceId = null,
  firstRun,
  username,
  counter
) {
  try {
    const params = {
      // max_results: 5,
      //firstRun ? 1 : 100,
      "tweet.fields": "created_at,attachments",
      expansions: "attachments.media_keys",
      "media.fields": "url",
      ...(sinceId && { since_id: sinceId }),
    };
    const data = await makeRequest(
      `https://api.twitter.com/2/users/${userId}/tweets`,
      counter,
      params
    );
    if (!data.data) return [];

    const mediaMap = new Map();
    if (data.includes && data.includes.media) {
      data.includes.media.forEach((media) => {
        mediaMap.set(media.media_key, media.url);
      });
    }

    firstRun = false;

    return data.data.map((tweet) => ({
      account: accountName,
      tweet_id: tweet.id,
      created_at: tweet.created_at,
      text: tweet.text,
      image_url:
        tweet.attachments && tweet.attachments.media_keys
          ? mediaMap.get(tweet.attachments.media_keys[0])
          : null,
      last_cron_date: Date.now(),
      tweet_link: `https://x.com/${username}/status/${tweet.id}`,
    }));
  } catch (error) {
    console.error(`Error fetching tweets for ${accountName}:`, error.message);
    return [];
  }
}

export const twitterDataCrawler = async () => {
  let firstRun = true;
  const counter = { value: 0 }; // Use an object to pass by reference
  console.log("Start crawler");
  const accounts = await loadData();
  for (const account of accounts) {
    console.log(`Processing account: ${account.name}`);
    const userId = await getUserId(account.username, counter);
    console.log("tweet userId", userId);

    if (userId) {
      const lastTweet = await Tweet.findOne({ account: account.name }).sort({
        created_at: -1,
      });
      const sinceId = lastTweet ? lastTweet.tweet_id : null;

      const tweets = await getRecentTweets(
        userId,
        account.name,
        sinceId,
        firstRun,
        account.username,
        counter
      );

      for (const tweet of tweets) {
        if (tweet.image_url) {
          tweet.s3_image_url = await uploadImageToS3(
            tweet.image_url,
            tweet.tweet_id
          );
        }
        const newTweet = new Tweet(tweet);
        await newTweet.save();
        console.log(`Saved tweet ID ${tweet.tweet_id} to MongoDB.`);
      }
    }
    await sleep(5000); // Wait between accounts
  }
};
