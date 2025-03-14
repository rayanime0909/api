const express = require("express");
const { News, Recommendations, Seasons, Users } = require("../database");
const moment = require("moment");
const router = express.Router();

const getTimeAgo = (date) => {
  moment.locale("ar");
  const result = moment(date).fromNow();
  moment.locale("en");
  return result;
};

router.get("/", async (req, res) => {
  try {
    const seasons = await Seasons.findAll({
      order: [["createdAt", "DESC"]],
      limit: 6,
    });

    const recommendations = await Recommendations.findAll({
      order: [["createdAt", "DESC"]],
      limit: 6,
    });

    const news = await News.findAll({
      order: [["createdAt", "DESC"]],
      limit: 2,
      include: [
        {
          model: Users,
          as: "User",
          attributes: ["id", "username", "avatar", "role", "isAdmin"],
        },
      ],
    });
    const newsWithTimeAgo = news.map(item => ({
      ...item.toJSON(),
      timeAgo: getTimeAgo(item.createdAt)
    }));
    res.json({
      news: newsWithTimeAgo,
      seasons,
      recommendations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("حدث خطأ أثناء جلب البيانات");
  }
});

module.exports = router;
