const express = require("express");
const { Ratings, Users, News, Seasons, Recommendations } = require("../database");
const { Sequelize } = require("sequelize");

const router = express.Router();

router.post("/rate", async (req, res) => {
  try {
    const { userId, itemId, rating, type } = req.body;

    if (!userId || !itemId || rating === undefined || !type) {
      return res.status(400).json({
        message: "معرف المستخدم، معرف العنصر، التقييم، ونوع العنصر مطلوبون",
      });
    }

    const isNews = type === 'news';
    const isSeason = type === 'seasons';
    const isRecommendation = type === 'recommendations';

    if (!isNews && !isSeason && !isRecommendation) {
      return res.status(400).json({ message: "نوع التقييم غير صالح" });
    }

    const existingRating = await Ratings.findOne({
      where: { userId, itemId, type },
    });

    if (existingRating) {
      await existingRating.update({ rating });
    } else {
      await Ratings.create({ userId, itemId, rating, type });

      const user = await Users.findByPk(userId);
      if (user) {
        await user.update({ ratingsCount: user.ratingsCount + 1 });
      }
    }

    const ratings = await Ratings.findAll({
      where: { itemId },
      attributes: [
        [Sequelize.fn("SUM", Sequelize.col("rating")), "totalScore"],
        [Sequelize.fn("COUNT", Sequelize.col("rating")), "totalRaters"],
      ],
    });

    const { totalScore, totalRaters } = ratings[0].dataValues;
    const averageScore = totalScore / totalRaters;

    if (isNews) {
      const news = await News.findByPk(itemId);
      if (news) {
        await news.update({ totalScore, totalRaters, averageScore });
      }
    } else if (isSeason) {
      const season = await Seasons.findByPk(itemId);
      if (season) {
        await season.update({ totalScore, totalRaters, averageScore });
      }
    } else if (isRecommendation) {
      const recommendation = await Recommendations.findByPk(itemId);
      if (recommendation) {
        await recommendation.update({ totalScore, totalRaters, averageScore });
      }
    }

    res.json({
      message: "تم إضافة التقييم بنجاح",
      averageRating: averageScore,
      totalRaters,
    });
  } catch (error) {
    console.error("Rating error:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء إضافة التقييم",
      details: error.message,
    });
  }
});

router.get("/rate/:type/:itemId/:userId?", async (req, res) => {
  try {
    const { type, itemId, userId } = req.params;

    if (!type || !itemId || !userId) {
      return res.status(400).json({
        hasRated: false,
        message: "معرف النوع والمستخدم والموسم مطلوب",
      });
    }

    const models = {
      news: News,
      seasons: Seasons,
      recommendations: Recommendations,
    };

    const model = models[type];
    if (!model) {
      return res.status(400).json({ message: "نوع التقييم غير صالح" });
    }

    const item = await model.findByPk(itemId);
    if (!item) {
      return res.status(404).json({
        hasRated: false,
        message: "الموسم أو العنصر غير موجود",
      });
    }

    const existingRating = await Ratings.findOne({
      where: { itemId, userId, type },
    });

    res.json({
      itemId: item.id,
      averageRating: item.averageScore || 0,
      totalRaters: item.totalRaters || 0,
      hasRated: !!existingRating,
      userRating: existingRating ? existingRating.rating : null,
    });
  } catch (error) {
    console.error("Rating check error:", error);
    res.status(500).json({
      hasRated: false,
      error: "حدث خطأ أثناء التحقق من التقييم",
    });
  }
});

router.delete("/rate/:itemId/:userId?", async (req, res) => {
  try {
    const { userId, itemId } = req.params;

    if (!userId || !itemId) {
      return res.status(400).json({ message: "يرجى توفير userId و itemId" });
    }

    const existingRating = await Ratings.findOne({
      where: { userId, itemId },
    });

    if (!existingRating) {
      return res.status(404).json({ message: "لم يتم العثور على التقييم" });
    }

    const oldScore = existingRating.rating;

    await existingRating.destroy();

    const remainingRatings = await Ratings.findAll({
      where: { itemId },
    });

    const totalScore = remainingRatings.reduce(
      (sum, rating) => sum + rating.rating,
      0
    );
    const averageRating =
      remainingRatings.length > 0
        ? parseFloat((totalScore / remainingRatings.length).toFixed(2))
        : 0;

    const models = {
      news: News,
      seasons: Seasons,
      recommendations: Recommendations,
    };

    for (let key in models) {
      const item = await models[key].findByPk(itemId);
      if (item) {
        await item.update({
          totalScore,
          averageScore: averageRating,
          totalRaters: remainingRatings.length,
        });
        break;
      }
    }

    const user = await Users.findByPk(userId);
    if (user) {
      await user.update({
        ratingsCount: user.ratingsCount - 1,
      });
    }

    res.json({
      message: "تم حذف التقييم بنجاح",
      averageRating,
      totalRaters: remainingRatings.length,
    });
  } catch (error) {
    console.error("Delete rating error:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء حذف التقييم",
      details: error.message,
    });
  }
});

module.exports = router;
