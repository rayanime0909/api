const express = require("express");
const router = express.Router();
const { WelcomeMessage } = require("../models");

router.get("/", async (req, res) => {
    try {
      const message = await WelcomeMessage.findOne();
      if (!message) {
        return res.status(404).json({ error: "الرسالة الترحيبية غير موجودة" });
      }
      res.status(200).json(message);
    } catch (error) {
      res.status(500).json({ error: "خطأ في استرجاع الرسالة الترحيبية", details: error.message });
    }
  });
 
router.post("/", async (req, res) => {
  try {
    const { title, message, createdBy, imageUrl, downloadUrl, isActive } = req.body;

    if (!title || !message || !createdBy) {
      return res.status(400).json({ error: "الرجاء توفير العنوان والنص والشخص المنشئ" });
    }

    const newMessage = await WelcomeMessage.create({
      title,
      message,
      createdBy,
      imageUrl,
      downloadUrl,
      isActive,
    });

    res.status(201).json({ message: "تم إضافة الرسالة بنجاح", data: newMessage });
  } catch (error) {
    res.status(500).json({ error: "خطأ أثناء إنشاء الرسالة", details: error.message });
  }
});

router.put("/", async (req, res) => {
    try {
      const { title, message, createdBy, imageUrl, downloadUrl, isActive } = req.body;
  
      const existingMessage = await WelcomeMessage.findOne();
      if (!existingMessage) {
        return res.status(404).json({ error: "الرسالة الترحيبية غير موجودة" });
      }
  
      await existingMessage.update({
        title,
        message,
        createdBy,
        imageUrl,
        downloadUrl,
        isActive,
      });
  
      res.status(200).json({ message: "تم تحديث الرسالة بنجاح", data: existingMessage });
    } catch (error) {
      res.status(500).json({ error: "خطأ أثناء تحديث الرسالة", details: error.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      const existingMessage = await WelcomeMessage.findByPk(id);
      if (!existingMessage) {
        return res.status(404).json({ error: "الرسالة غير موجودة" });
      }
  
      await existingMessage.destroy();
      res.status(200).json({ message: "تم حذف الرسالة بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "خطأ أثناء حذف الرسالة", details: error.message });
    }
  });
  
  module.exports = router;
  