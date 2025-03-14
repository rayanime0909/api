const express = require('express');
const router = express.Router();
const { News, Recommendations, Seasons, Users } = require("../database");
const { Op } = require("sequelize");


router.get("/news/count", async (req, res) => {
    try {
      const count = await News.count(); 
      res.status(200).json({ newsCount: count || 0 });
    } catch (error) {
      res.status(500).json({
        error: "حدث خطأ أثناء جلب عدد الأخبار",
        details: error.message,
      });
    }
  });
  
  router.get("/seasons/count", async (req, res) => {
    try {
      const count = await Seasons.count(); 
      res.status(200).json({ seasonsCount: count || 0 });
    } catch (error) {
      res.status(500).json({
        error: "حدث خطأ أثناء جلب عدد الأخبار",
        details: error.message,
      });
    }
  });

  router.get("/recommendations/count", async (req, res) => {
    try {
      const count = await Recommendations.count(); 
      res.status(200).json({ recommendationsCount: count || 0 });
    } catch (error) {
      res.status(500).json({
        error: "حدث خطأ أثناء جلب عدد الأخبار",
        details: error.message,
      });
    }
  });
  router.get("/users/count", async (req, res) => {
    try {
      const usersCount = await Users.count();
      res.status(200).json({ usersCount });
    } catch (error) {
      console.error("Error fetching users count:", error.message);
      res.status(500).json({
        error: "حدث خطأ أثناء جلب عدد المستخدمين",
        details: error.message,
      });
    }
  });

  module.exports = router;