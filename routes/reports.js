const express = require('express');
const router = express.Router();
const { Report, Comment } = require('../database');  

router.get("/", async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [{ model: Comment, as: 'comments' }] 
    });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب البلاغات', error });
  }
});

router.get("/:reportId/comments", async (req, res) => {
  try {
    const reportId = req.params.reportId;
    const comments = await Comment.findAll({
      where: { reportId },
    });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب التعليقات', error });
  }
});

module.exports = router;
