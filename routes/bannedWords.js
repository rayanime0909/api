const express = require("express");
const router = express.Router();
const { BannedWords, Users } = require("../database");
const jwt = require('jsonwebtoken');
const fs = require('fs');

const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    
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
router.post("/add",authenticateJWT, async (req, res) => {
  const { word } = req.body;
  const userId = req.user.userId;

  if (!word) {
    return res.status(400).json({ message: "الكلمة الممنوعة مطلوبة" });
  }

  try {
    const user = await Users.findByPk(userId);
    if (!user || (user.role !== 1 && user.role !== 3)) {
      return res.status(403).json({ message: "ليس لديك إذن لإضافة الكلمة" });
    }

    const existingWord = await BannedWords.findOne({ where: { word } });
    if (existingWord) {
      return res.status(400).json({ message: "الكلمة الممنوعة موجودة بالفعل" });
    }

    const newWord = await BannedWords.create({ word, addedBy: userId });
    res.status(201).json({ message: "تم إضافة الكلمة الممنوعة بنجاح", newWord });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء إضافة الكلمة الممنوعة" });
  }
});

router.put("/edit/:id",authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { word } = req.body;
  const userId = req.user.userId;

  if (!word) {
    return res.status(400).json({ message: "الكلمة الممنوعة مطلوبة" });
  }

  try {
    const user = await Users.findByPk(userId);
    if (!user || (user.role !== 1 && user.role !== 3)) {
      return res.status(403).json({ message: "ليس لديك إذن لتعديل الكلمة" });
    }

    const bannedWord = await BannedWords.findByPk(id);
    if (!bannedWord) {
      return res.status(404).json({ message: "الكلمة الممنوعة غير موجودة" });
    }

    bannedWord.word = word;
    await bannedWord.save();

    res.status(200).json({ message: "تم تعديل الكلمة الممنوعة بنجاح", bannedWord });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء تعديل الكلمة الممنوعة" });
  }
});

router.delete("/delete/:id",authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const user = await Users.findByPk(userId);
    if (!user || (user.role !== 1 && user.role !== 3)) {
      return res.status(403).json({ message: "ليس لديك إذن لحذف الكلمة" });
    }

    const bannedWord = await BannedWords.findByPk(id);
    if (!bannedWord) {
      return res.status(404).json({ message: "الكلمة الممنوعة غير موجودة" });
    }

    await bannedWord.destroy();
    res.status(200).json({ message: "تم حذف الكلمة الممنوعة بنجاح" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء حذف الكلمة الممنوعة" });
  }
});
router.get("/all", async (req, res) => {
    try {
      const bannedWords = await BannedWords.findAll({
        include: [
          {
            model: Users,
            as: "User",
            attributes: ["id", "username", "avatar", "role", "isAdmin"]
          }
        ],
        order: [["createdAt", "DESC"]]
      });
  
      res.status(200).json({ bannedWords });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "حدث خطأ أثناء جلب الكلمات الممنوعة" });
    }
  });
  
module.exports = router;
