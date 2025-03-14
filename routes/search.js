const express = require("express");
const { Sequelize } = require("sequelize");

const { News, Recommendations, Seasons, Users } = require("../database");
const router = express.Router();

router.get("/", async (req, res) => {
  const { query, type, limit = 5, page = 1 } = req.query;

  if (!query || query.trim() === "") {
    return res.status(400).json({
      message: "الرجاء توفير استعلام للبحث"
    });
  }

  const offset = (page - 1) * limit; 

  try {
    let results = [];
    let totalCount = 0; 

    if (!type || type === "news") {
      const newsResults = await News.findAndCountAll({
        where: {
          [Sequelize.Op.or]: [
            { title: { [Sequelize.Op.like]: `%${query}%` } },
          ],
        
        },
        include: [
          {
            model: Users,
            as: "User",
            attributes: ["id", "username", "avatar", "role", "isAdmin"],
          },
        ],
       
        limit: parseInt(limit), 
        offset: parseInt(offset), 
      });

      if (newsResults.rows.length > 0) {
        results = results.concat(newsResults.rows);
        totalCount = newsResults.count; 
      }
    }

    if (!type || type === "recommendations") {
      const recommendationsResults = await Recommendations.findAndCountAll({
        where: {
          [Sequelize.Op.or]: [
            { title: { [Sequelize.Op.like]: `%${query}%` } }, 
            { title_english: { [Sequelize.Op.like]: `%${query}%` } }, 
          ],
        },
        limit: parseInt(limit),  
        offset: parseInt(offset), 
      });

      if (recommendationsResults.rows.length > 0) {
        results = results.concat(recommendationsResults.rows);
        totalCount = recommendationsResults.count; 
      }
    }

    if (!type || type === "seasons") {
      const seasonsResults = await Seasons.findAndCountAll({
        where: {
          [Sequelize.Op.or]: [
            { title: { [Sequelize.Op.like]: `%${query}%` } }, 
            { title_english: { [Sequelize.Op.like]: `%${query}%` } },
          ],
        },
        limit: parseInt(limit),  
        offset: parseInt(offset), 
      });

      if (seasonsResults.rows.length > 0) {
        results = results.concat(seasonsResults.rows);
        totalCount = seasonsResults.count;
      }
    }

    if (results.length === 0) {
      return res.status(400).json({
        message: "لا توجد نتائج للبحث"
      });
    }

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      results: results, 
      totalCount: totalCount, 
      totalPages: totalPages, 
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "حدث خطأ أثناء إجراء البحث"
    });
  }
});

module.exports = router;
