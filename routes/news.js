const express = require("express");
const { News, Users,Ratings, Recommendations,Seasons } = require("../database");
const { Sequelize } = require("sequelize");

const router = express.Router();
const moment = require("moment");
const getTimeAgo = (date) => {
  moment.locale("ar");
  const result = moment(date).fromNow();
  moment.locale("en");
  return result;
};
router.post("/", async (req, res) => {
  const newsData = req.body;

  const requiredFields = ["content", "image", "title", "publisherId"];
  for (const field of requiredFields) {
    if (!newsData[field]) {
      return res.status(400).json({ message: `${field} is required` });
    }
  }

  try {
    newsData.id = Math.floor(Date.now() / 1000).toString();
    newsData.timestamp = Date.now();
    const newNews = await News.create(newsData);
    res.json(newNews);
  } catch (error) {
    res.status(500).json({ message: "Error saving news", error });
  }
});

router.get("/", async (req, res) => {
  const {
    page = 1,
    limit = 6,
    sort = "createdAt",
    order = "DESC",
  } = req.query;

  const filter = {};

  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await News.findAndCountAll({
      where: filter,
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Users,
          as: "User", 
          attributes: ["id", "username", "avatar","role", "isAdmin"],
        },
      ],
    });
    const rowsWithTimeAgo = rows.map(item => ({
      ...item.toJSON(),
      timeAgo: getTimeAgo(item.createdAt)
    }));
    

    res.json({
      data: rowsWithTimeAgo,
      pagination: {
        total: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching news", error: error.message || error });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const news = await News.findByPk(id, {
      include: [
        {
          model: Users,
          as: "User", 
          attributes: ["id", "username", "avatar","role", "isAdmin"],
        },
      ],
    });
    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }
    const newsWithTimeAgo = news.map(item => ({
      ...item.toJSON(),
      timeAgo: getTimeAgo(item.createdAt)
    }));
    res.json(newsWithTimeAgo);
  } catch (error) {
    res.status(500).json({ message: "Error fetching news", error });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedRows = await News.destroy({ where: { id } });
    if (!deletedRows) {
      return res.status(404).json({ message: "News not found" });
    }
    res.json({ message: "News deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting news", error });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const news = await News.findByPk(id);
    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    await news.update(updatedData);
    res.json({ message: "News updated successfully", news });
  } catch (error) {
    res.status(500).json({ message: "Error updating news", error });
  }
});




router.post("/add-view/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const newsItem = await News.findByPk(id);

    if (!newsItem) {
      return res.status(404).json({ message: "العنصر غير موجود" });
    }

    newsItem.views += 1;
    await newsItem.save();

    return res.status(200).json({ message: "تم تحديث عدد المشاهدات", views: newsItem.views });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "حدث خطأ أثناء تحديث المشاهدات" });
  }
});
module.exports = router;
