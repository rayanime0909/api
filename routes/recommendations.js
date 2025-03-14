const express = require("express");
const axios = require("axios");
const { Sequelize } = require("sequelize");
const { Recommendations } = require("../database");
const router = express.Router();
const utils = require("./utils");

const buildSearchFilter = (query) => {
  const filter = {};
  const {
    year,
    status,
    genre,
    studio,
    type,
    score,
    minScore,
    popularity,
    rank,
  } = query;

  if (year) filter.year = parseInt(year);
  if (status) filter.status = status;
  if (type) filter.type = type;

  if (genre) {
    filter.genres = {
      [Sequelize.Op.like]: `%${genre}%`,
    };
  }

  if (studio) {
    filter.studio = {
      [Sequelize.Op.like]: `%${studio}%`,
    };
  }

  if (score) {
    filter.score = {
      [Sequelize.Op.gte]: parseFloat(score),
    };
  }

  if (minScore) {
    filter.score = {
      [Sequelize.Op.gte]: parseFloat(minScore),
    };
  }

  if (popularity) {
    filter.popularity = {
      [Sequelize.Op.gte]: parseInt(popularity),
    };
  }

  if (rank) {
    filter.rank = {
      [Sequelize.Op.lte]: parseInt(rank),
    };
  }

  return filter;
};

router.get("/", async (req, res) => {
  try {
    const filter = buildSearchFilter(req.query);
    const { page = 1, limit = 20, sort } = req.query;

    const order = [];
    if (sort) {
      const [field, direction] = sort.split(":");
      if (
        field &&
        ["score", "popularity", "year", "title", "rank"].includes(field)
      ) {
        order.push([
          field,
          direction?.toUpperCase() === "DESC" ? "DESC" : "ASC",
        ]);
      }
    } else {
      order.push(["createdAt", "DESC"]);
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Recommendations.findAndCountAll({
      where: filter,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      error: "حدث خطأ أااثناء البحث في التوصيات",
      details: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const recommendation = await Recommendations.findByPk(req.params.id);
    if (!recommendation) {
      return res.status(404).json({ message: "لم يتم العثور على التوصية" });
    }

    await recommendation.increment("views");

    res.json(recommendation);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء جلب التوصية",
      details: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { animeId, summary, publisherId } = req.body;
    if (!animeId) {
      return res.status(400).json({
        message: "معرف الأنمي مطلوب",
      });
    }
    if (!summary) {
      return res.status(400).json({
        message: "ملخص التوصية مطلوب",
      });
    }
    if (!publisherId) {
      return res.status(400).json({
        message: "معرف الناشر مطلوب",
      });
    }
    const response = await axios.get(
      `https://api.jikan.moe/v4/anime/${animeId}`,
      { timeout: 5000 }
    );

    const animeData = response.data.data;

    const newRecommendation = await Recommendations.create({
      url: animeData.url,
      mal_id: animeData.mal_id,
      title: animeData.title,
      title_english: animeData.title_english,
      imageUrl: animeData.images.jpg.image_url,
      studio: JSON.stringify(animeData.studios.map((studio) => studio.name)),
      genres: JSON.stringify([
        ...utils.translateGenres(animeData.genres),
        ...utils.translateGenres(animeData.themes),
        ...utils.translateGenres(animeData.demographics),
      ]),
      episodes: animeData.episodes,
      season: utils.translateSeason(animeData.season),
      year: animeData.year,
      age: utils.formatRating(animeData.rating),
      aired_from: utils.formatAiredDate(animeData.aired.from),
      aired_to: utils.formatAiredDate(animeData.aired.to),
      trailer: animeData.trailer.youtube_id,
      status: utils.translateStatus(animeData.status),
      duration: utils.formatDuration(animeData.duration),
      type: animeData.type === "TV" ? "مسلسل" : "فلم",
      source: utils.translateSources(animeData.source),
      score: animeData.score,
      scored_by: animeData.scored_by,
      rank: animeData.rank,
      popularity: animeData.popularity,
      members: animeData.members,
      favorites: animeData.favorites,
      summary,
      publisherId,
      views: 0,
      date: new Date().toISOString().split("T")[0],
    });

    res.status(201).json(newRecommendation);
  } catch (error) {
    console.error("Creation error:", error);
    res.status(500).json({
      error: "فشل في إنشاء توصية جديدة",
      details: error.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const recommendation = await Recommendations.findByPk(req.params.id);
    if (!recommendation) {
      return res.status(404).json({ message: "لم يتم العثور على التوصية" });
    }

    if (req.body.genres) {
      req.body.genres = JSON.stringify(req.body.genres);
    }
    if (req.body.studio) {
      req.body.studio = JSON.stringify(req.body.studio);
    }

    const updatedRecommendation = await recommendation.update(req.body);
    res.json(updatedRecommendation);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء تحديث التوصية",
      details: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await Recommendations.destroy({
      where: { id: req.params.id },
    });

    if (!result) {
      return res.status(404).json({ message: "لم يتم العثور على التوصية" });
    }

    res.json({ message: "تم حذف التوصية بنجاح" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء حذف التوصية",
      details: error.message,
    });
  }
});
router.post("/add-view/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const recommendationsItem = await Recommendations.findByPk(id);

    if (!recommendationsItem) {
      return res.status(404).json({ message: "العنصر غير موجود" });
    }

    recommendationsItem.views += 1;
    await recommendationsItem.save();

    return res.status(200).json({ message: "تم تحديث عدد المشاهدات", views: recommendationsItem.views });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "حدث خطأ أثناء تحديث المشاهدات" });
  }
});
module.exports = router;
