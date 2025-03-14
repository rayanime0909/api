const express = require("express");
const multer = require("multer");
const path = require("path");
const { Users, Comments, Ratings, Op } = require("../database");
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("نوع الملف غير مدعوم. يسمح فقط بصور JPEG و PNG"));
  }
};
const upload = multer({ storage });

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


router.post(
  "/upload",
  authenticateJWT,
  upload.fields([{ name: "avatar" }, { name: "backgroundImage" }]),
  async (req, res) => {
    try {
      const userId = req.user.userId;

      const avatar = req.files["avatar"]
      ? path.posix.join("/", req.files["avatar"][0].path)
      : null;
    
      const backgroundImage = req.files["backgroundImage"]
        ? path.posix.join("/", req.files["backgroundImage"][0].path)
        : null;
      console.log(avatar);
      
      const user = await Users.findOne({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      const updatedUser = await user.update({
        avatar: avatar ? avatar : user.avatar,
        backgroundImage: backgroundImage ? backgroundImage  : user.backgroundImage,
      });

      res.status(200).json({
        message: "تم رفع الصور وتحديث بيانات المستخدم بنجاح",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          avatar: updatedUser.avatar,
          backgroundImage: updatedUser.backgroundImage,
        },
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      res.status(500).json({ error: "حدث خطأ أثناء رفع الصور" });
    }
  }
);

router.delete('/delete-account', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await Users.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    await Ratings.destroy({ where: { userId } });

    await Comments.destroy({ where: { userId } });

    await user.destroy();

    res.status(200).json({ message: "تم حذف الحساب بنجاح" });
  } catch (error) {
    console.error("Error deleting account:", error.message);
    res.status(500).json({
      error: "حدث خطأ أثناء حذف الحساب",
      details: error.message,
    });
  }
});

router.delete('/delete-image', authenticateJWT, async (req, res) => {
  try {
    const { type } = req.body; 
    const userId = req.user.userId;

    if (!type || (type !== 'avatar' && type !== 'backgroundImage')) {
      return res.status(400).json({ message: "نوع الصورة مطلوب ويجب أن يكون 'avatar' أو 'backgroundImage'" });
    }

    const user = await Users.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    const imagePath = type === 'avatar' ? user.avatar : user.backgroundImage;

    if (!imagePath) {
      return res.status(400).json({ message: "لا توجد صورة للحذف" });
    }

    const localPath = path.join(__dirname, '..', imagePath.replace(process.env.BASE_URL, ''));
    fs.unlink(localPath, (err) => {
      if (err) {
        console.error("Error deleting file:", err.message);
      } else {
        console.log("Image deleted successfully:", localPath);
      }
    });

    await user.update({
      [type]: "",
    });

    res.status(200).json({ message: "تم حذف الصورة بنجاح" });
  } catch (error) {
    console.error("Error deleting image:", error.message);
    res.status(500).json({ error: "حدث خطأ أثناء حذف الصورة", details: error.message });
  }
});

router.get("/all", async (req, res) => {
  try {
    const users = await Users.findAll();

    if (users.length === 0) {
      return res.status(404).json({ message: "لا يوجد مستخدمون" });
    }

    res.status(200).json({
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        backgroundImage: user.backgroundImage,
        commentsCount: user.commentsCount,
        ratingsCount: user.ratingsCount,
        role: user.role,
        isAdmin: user.isAdmin,
        isBanned: user.isBanned,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء جلب جميع المستخدمين",
      details: error.message,
    });
  }
});

router.put("/update", authenticateJWT, async (req, res) => {
  try {
    const { username, bio, email, avatar, backgroundImage } = req.body;
    const userId = req.user.userId;
    console.log("User ID:", userId);

    let user = await Users.findOne({ where: { id: userId } });
    if (!user) {
      user = await Users.create({
        id: userId,
        username: username || "username_animeray",
        email: email || "",
        avatar: avatar || "",
        bio: bio || "لا يوجد وصف",
        backgroundImage: backgroundImage || "",
      });

      return res.status(201).json({
        message: "تم إنشاء المستخدم بنجاح",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio || "لا يوجد وصف",
          backgroundImage: user.backgroundImage,
        },
      });
    }
    const updatedUser = await user.update({
      username: typeof username === "string" ? username : user.username,
      email: typeof email === "string" ? email : user.email,
      avatar: typeof avatar === "string" ? avatar : user.avatar,
      backgroundImage:
        typeof backgroundImage === "string"
          ? backgroundImage
          : user.backgroundImage,
      bio: typeof bio === "string" ? bio : user.bio,
    });

    res.status(200).json({
      message: "تم تحديث البيانات بنجاح",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        backgroundImage: updatedUser.backgroundImage,
        bio: updatedUser.bio,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء تحديث البيانات",
      details: error.message,
    });
  }
});


router.get("/:userId/profile", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await Users.findOne({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        backgroundImage: user.backgroundImage,
        comments: user.commentsCount,
        ratings: user.ratingsCount,
        replies: user.repliesCount,
        role: user.role,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء جلب بيانات المستخدم",
      details: error.message,
    });
  }
});



router.get("/me",authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await Users.findOne({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        backgroundImage: user.backgroundImage,
        comments: user.commentsCount,
        ratings: user.ratingsCount,
        replies: user.repliesCount,
        role: user.role,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء جلب بيانات المستخدم",
      details: error.message,
    });
  }
});

router.get("/user/:userId/comments-count", async (req, res) => {
  try {
    const userId = req.params.userId;

    const commentsCount = await Comments.count({
      where: { userId },
    });

    res.status(200).json({ commentsCount });
  } catch (error) {
    console.error("Error fetching comments count:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء جلب عدد التعليقات",
      details: error.message,
    });
  }
});

router.get("/user/:userId/ratings-count", async (req, res) => {
  try {
    const userId = req.params.userId;

    const ratingsCount = await Ratings.count({
      where: { userId },
    });

    res.status(200).json({ ratingsCount });
  } catch (error) {
    console.error("Error fetching ratings count:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء جلب عدد التقييمات",
      details: error.message,
    });
  }
});

router.post("/user/:userId/add-rating", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { ratingValue } = req.body;

    if (!ratingValue) {
      return res.status(400).json({ message: "قيمة التقييم مطلوبة" });
    }

    await Ratings.create({
      userId,
      value: ratingValue,
    });

    await Users.update(
      {
        ratingsCount: sequelize.literal("ratingsCount + 1"),
      },
      {
        where: { id: userId },
      }
    );

    res.status(201).json({ message: "تم إضافة التقييم بنجاح" });
  } catch (error) {
    console.error("Error adding rating:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء إضافة التقييم",
      details: error.message,
    });
  }
});

router.delete("/user/:userId/remove-rating/:ratingId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const ratingId = req.params.ratingId;

    await Ratings.destroy({
      where: { id: ratingId, userId },
    });

    await Users.update(
      {
        ratingsCount: sequelize.literal("ratingsCount - 1"),
      },
      {
        where: { id: userId },
      }
    );

    res.status(200).json({ message: "تم إزالة التقييم بنجاح" });
  } catch (error) {
    console.error("Error removing rating:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء إزالة التقييم",
      details: error.message,
    });
  }
});

router.put("/user/:userId/update-role", authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, isAdmin } = req.body;
    const requestingUserId = req.user.userId;

    // التحقق مما إذا كان المستخدم الذي يجري الطلب مسؤولًا
    const requestingUser = await Users.findOne({ where: { id: requestingUserId } });

    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: "ليس لديك صلاحية لتغيير رتبة المستخدم" });
    }

    // التحقق مما إذا كان المستخدم المستهدف موجودًا
    const user = await Users.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    // تحديث بيانات المستخدم
    const updatedUser = await user.update({
      role: role || user.role,
      isAdmin: typeof isAdmin === "boolean" ? isAdmin : user.isAdmin,
    });

    res.status(200).json({
      message: "تم تحديث رتبة المستخدم بنجاح",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        isAdmin: updatedUser.isAdmin,
      },
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء تحديث رتبة المستخدم",
      details: error.message,
    });
  }
});

router.get("/isAdmin/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await Users.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    res.status(200).json({ isAdmin: user.isAdmin });
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء التحقق من صلاحية المستخدم",
      details: error.message,
    });
  }
});

module.exports = router;
