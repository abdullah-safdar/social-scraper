import moment from "moment";
import { Parser } from "json2csv";
import Tweet from "../schema/tweet.schema.js";

export const getFilteredDb = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const _startDate = moment
      .utc(startDate, "YYYY-MM-DD")
      .startOf("day")
      .toDate();
    const _endDate = moment.utc(endDate, "YYYY-MM-DD").endOf("day").toDate();

    console.log(startDate, endDate, _startDate, _endDate);

    const query = {
      createdAt: {
        $gte: _startDate,
        $lte: _endDate,
      },
    };

    const results = await Tweet.find(query);

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "No data found for the given date range." });
    }

    const fields = [
      "account",
      "tweet_id",
      "created_at",
      "text",
      "image_url",
      "s3_image_url",
      "last_cron_date",
      "tweet_link",
    ];

    const opts = { fields, defaultValue: "" };
    const parser = new Parser(opts);
    const csv = parser.parse(results);

    res.header("Content-Type", "text/csv");
    res.attachment("tweets_export.csv");
    res.send(csv);
  } catch (error) {
    console.log(error.message);
  }
};
