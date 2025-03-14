const express = require("express");
const { Sequelize } = require("sequelize");
const { News, Recommendations, Seasons, Users } = require("../database");
const router = express.Router();

router.get("/best", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 
    const offset = (page - 1) * limit; 

    const newsResults = await News.findAll({
      order: [["averageScore", "DESC"]],
      include: [
        {
          model: Users,
          as: "User",
          attributes: ["id", "username", "avatar", "role", "isAdmin"],
        },
      ],
    });

    const recommendationsResults = await Recommendations.findAll({
      order: [["averageScore", "DESC"]],
    });

    const seasonsResults = await Seasons.findAll({
      order: [["averageScore", "DESC"]],
    });

    const topNewsResults = [
      ...newsResults.map((item) => ({ ...item.toJSON() })),
      ...recommendationsResults.map((item) => ({
        ...item.toJSON(),
      })),
      ...seasonsResults.map((item) => ({ ...item.toJSON() })),
    ];

    topNewsResults.sort((a, b) => b.averageScore - a.averageScore);

    const totalItems = topNewsResults.length;
    const totalPages = Math.ceil(totalItems / limit);

    const paginatedResults = topNewsResults.slice(offset, offset + limit);

    res.status(200).json({
      results: paginatedResults,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching top news:", error);
    res.status(500).json({ error: "Failed to fetch top news" });
  }
});

router.get("/latest", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const latestNews = await News.findAll({
      attributes: {
        include: [Sequelize.literal('"News"')]
      },
      order: [["createdAt", "DESC"]]
    });

    const latestRecommendations = await Recommendations.findAll({
      attributes: {
        include: [Sequelize.literal('"Recommendations"')]
      },
      order: [["createdAt", "DESC"]]
    });

    const latestSeasons = await Seasons.findAll({
      attributes: {
        include: [Sequelize.literal('"Seasons"')]
      },
      order: [["createdAt", "DESC"]]
    });

    const allLatestItems = [
      ...latestNews,
      ...latestRecommendations,
      ...latestSeasons
    ].map(item => item.toJSON());

    allLatestItems.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    const totalItems = allLatestItems.length;
    const totalPages = Math.ceil(totalItems / limit);

    const paginatedResults = allLatestItems.slice(offset, offset + limit);

    res.status(200).json({
      results: paginatedResults,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching latest items:", error);
    res.status(500).json({ error: "Failed to fetch latest items" });
  }
});

module.exports = router;
