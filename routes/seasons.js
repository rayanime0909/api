const express = require("express");
const axios = require("axios");
const { Sequelize } = require("sequelize");
const { Seasons, Ratings, Users } = require("../database");
const router = express.Router();
const utils = require("./utils");
const jwt = require('jsonwebtoken');
const fs = require('fs');


const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(403).json({ message: "التوكن مفقود أو غير صحيح" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(403).json({ message: "التوكن مفقود" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "توكن غير صالح" });
  }
};

const buildSearchFilter = (query) => {
  const filter = {};
  const { year, status, genre, studio, season, type, score } = query;

  if (year) filter.year = parseInt(year);
  if (status) filter.status = status;
  if (type) filter.type = type;


  if (genre) {
    filter[Sequelize.Op.and] = Sequelize.literal(
      `json_extract(genres, '$') LIKE '%${genre}%'`
    );
  }

  if (studio) {
    filter[Sequelize.Op.and] = Sequelize.literal(
      `json_extract(studio, '$') LIKE '%${studio}%'`
    );
  }

  if (score) {
    filter.score = {
      [Op.gte]: parseFloat(score),
    };
  }

  if (season) {
    const seasonData = getCurrentSeason();
    let targetSeason;

    switch (season) {
      case "current":
        targetSeason = seasonData.current;
        console.log("current season: "+targetSeason.season + " " + targetSeason.year);
        
        break;
      case "previous":
        targetSeason = seasonData.previous;
        console.log("previous season: "+targetSeason.season + " " + targetSeason.year);

        break;
      case "next":
        targetSeason = seasonData.next;
        console.log("next season: "+targetSeason.season + " " + targetSeason.year);

        break;
      default:
        filter.season = season;
    }

    if (targetSeason) {
      filter.season = targetSeason.season;
      filter.year = targetSeason.year;
    
    }
  }

  return filter;
};

router.get("/", async (req, res) => {
  try {
    const filter = buildSearchFilter(req.query);
    const { page = 1, limit = 20, sort} = req.query;

    const order = [];
    if (sort) {
      const [field, direction] = sort.split(":");
      if (field && ["score", "popularity", "year", "title", "createdAt"].includes(field)) {
        order.push([field, direction?.toUpperCase() === "DESC" ? "DESC" : "ASC"]);
      }
    } else {
      order.push(["createdAt", "DESC"]);
    }
   
    const offset = (page - 1) * limit;

    const { count, rows } = await Seasons.findAndCountAll({
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
      error: "حدث خطأ أثناء البحث",
      details: error.message,
    });
  }
});

router.get("/control-panel/", authenticateJWT, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "غير مصرح به",
        details: "يجب تسجيل الدخول للوصول إلى لوحة التحكم"
      });
    }

    const { page = 1, limit = 20, sort } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const offset = (pageNum - 1) * limitNum;

    const where = req.user.isAdmin
      ? {} 
      : { publisherId: req.user.userId };

      console.log("isAdmin : " + req.user.isAdmin);
      


    const { count, rows } = await Seasons.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
      include: [{
        model: Users,
        as: "User",
        attributes: ["id", "username", "avatar", "role", "isAdmin"],
      }],
    });

    if (count === 0) {
      return res.json({
        data: [],
        pagination: {
          total: 0,
          currentPage: pageNum,
          totalPages: 0,
          limit: limitNum,
        },
        message: "لا توجد عناصر متاحة"
      });
    }

    return res.json({
      data: rows,
      pagination: {
        total: count,
        currentPage: pageNum,
        totalPages: Math.ceil(count / limitNum),
        limit: limitNum,
      },
      message: "تم جلب البيانات بنجاح"
    });

  } catch (error) {
    console.error("خطأ في لوحة التحكم:", error);
    return res.status(500).json({
      error: "حدث خطأ أثناء جلب البيانات",
      details: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
    });
  }
});


router.patch('/:id/ads',authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { allowAds } = req.body;

  try {

      const anime = await Seasons.findById(id); 
      if (!anime) return res.status(404).json({ message: 'Anime not found' });

      anime.allowAds = allowAds;
      await anime.save();

      res.status(200).json({ message: 'Ads state updated successfully', anime });
  } catch (error) {
      console.error('Error updating ads state:', error);
      res.status(500).json({ message: 'Failed to update ads state' });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const season = await Seasons.findByPk(req.params.id);
    if (!season) {
      return res.status(404).json({ message: "لم يتم العثور على الموسم" });
    }

    await season.increment("views");

    res.json(season);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء جلب الموسم",
      details: error.message,
    });
  }
});

const getSeasonFromMonth = (month) => {
  if (month >= 1 && month <= 3) return "winter";
  if (month >= 4 && month <= 6) return "spring";
  if (month >= 7 && month <= 9) return "summer";
  if (month >= 10 && month <= 12) return "fall";
  return null;
};

const getCurrentSeason = () => {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const currentSeasonEn = getSeasonFromMonth(month);
  const currentSeason = utils.translateSeason(currentSeasonEn);

  const seasons = ["winter", "spring", "summer", "fall"];
  const currentSeasonIndex = seasons.indexOf(currentSeasonEn);
  const nextSeasonEn = seasons[(currentSeasonIndex + 1) % 4];
  const nextSeason = utils.translateSeason(nextSeasonEn);

  const nextSeasonYear = currentSeasonIndex === 3 ? year + 1 : year;

  const prevSeasonEn = seasons[(currentSeasonIndex - 1 + 4) % 4];
  const prevSeason = utils.translateSeason(prevSeasonEn);

  const prevSeasonYear = currentSeasonIndex === 0 ? year - 1 : year;

  return {
    current: {
      season: currentSeason,
      year: year,
    },
    next: {
      season: nextSeason,
      year: nextSeasonYear,
    },
    previous: {
      season: prevSeason,
      year: prevSeasonYear,
    },
  };
};
router.post("/",authenticateJWT, async (req, res) => {
  try {
    const { animeId, summary } = req.body;
    const publisherId = req.user.userId;

    if (!animeId) {
      return res.status(400).json({
        message: "معرف الانمي المطلوب",
      });
    }
    if (!summary) {
      return res.status(400).json({
        message: "ملخص الموسم المطلوب",
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

    const newSeason = await Seasons.create({
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

    res.status(201).json(newSeason);
  } catch (error) {
    console.error("Creation error:", error);
    res.status(500).json({
      error: "فشل في إنشاء موسم جديد",
      details: error.message,
    });
  }
});

router.patch("/:id", authenticateJWT, async (req, res) => {
  try {
    const { animeId, summary } = req.body;
    const publisherId = req.user.userId;

    if (!animeId) {
      return res.status(400).json({
        message: "معرف الانمي مطلوب",
      });
    }
    if (!summary) {
      return res.status(400).json({
        message: "ملخص الموسم مطلوب",
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

    if (!response.data || !response.data.data) {
      return res.status(404).json({
        error: "لم يتم العثور على بيانات للأنمي المطلوب",
      });
    }

    const animeData = response.data.data;

    let season = await Seasons.findOne({ where: { id: req.params.id } });

    if (!season) {
      season = await Seasons.create({
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

      return res.status(201).json(season);
    }

    season.summary = summary;
    season.publisherId = publisherId;

    await season.save(); 
    res.status(200).json(season); 

  } catch (error) {
    console.error("Creation error:", error);
    res.status(500).json({
      error: "فشل في معالجة البيانات",
      details: error.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const season = await Seasons.findByPk(req.params.id);
    if (!season) {
      return res.status(404).json({ message: "لم يتم العثور على الموسم" });
    }

    if (req.body.genres) {
      req.body.genres = JSON.stringify(req.body.genres);
    }
    if (req.body.studio) {
      req.body.studio = JSON.stringify(req.body.studio);
    }

    const updatedSeason = await season.update(req.body);
    res.json(updatedSeason);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء تحديث الموسم",
      details: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await Seasons.destroy({
      where: { id: req.params.id },
    });

    if (!result) {
      return res.status(404).json({ message: "لم يتم العثور على الموسم" });
    }

    res.json({ message: "تم حذف الموسم بنجاح" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء حذف الموسم",
      details: error.message,
    });
  }
});

router.post("/add-view/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const seasonsItem = await Seasons.findByPk(id);

    if (!seasonsItem) {
      return res.status(404).json({ message: "العنصر غير موجود" });
    }

    seasonsItem.views += 1;
    await seasonsItem.save();

    return res.status(200).json({ message: "تم تحديث عدد المشاهدات", views: seasonsItem.views });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "حدث خطأ أثناء تحديث المشاهدات" });
  }
});
module.exports = router;
