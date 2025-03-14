const express = require("express");
const moment = require("moment");

const {
  Comments,
  Users,
  UserInteractions,
  BannedWords,
  Notifications,
} = require("../database");
const { Op } = require("sequelize");

const router = express.Router();

const getTimeAgo = (date) => {
  moment.locale("ar");
  const result = moment(date).fromNow();
  moment.locale("en");
  return result;
};

const filterBannedWords = async (text) => {
  const bannedWords = await BannedWords.findAll({ attributes: ["word"] });
  const bannedWordsList = bannedWords.map((word) => word.word.trim());

  let words = text.split(/\s+/);

  words = words.map((word) => {
    const normalizedWord = word.trim();
    const isBanned = bannedWordsList.some(
      (bannedWord) =>
        normalizedWord.toLowerCase() === bannedWord.toLowerCase() ||
        normalizedWord.includes(bannedWord.toLowerCase())
    );

    return isBanned ? "*".repeat(word.length) : word;
  });

  return words.join(" ");
};

router.post("/comment", async (req, res) => {
  try {
    const { userId, seasonId, text, isSpoiler, parentId } = req.body;

    if (!userId || !seasonId || !text) {
      return res
        .status(400)
        .json({ message: "مطلوب معرف المستخدم، معرف الموسم والنص" });
    }

    const filteredText = await filterBannedWords(text);

    const newComment = await Comments.create({
      userId,
      seasonId,
      text: filteredText,
      isSpoiler,
      parentId: parentId || null,
    });

    const user = await Users.findByPk(userId);
    if (user) {
      await user.update({
        commentsCount: user.commentsCount + 1,
      });
    }
    res.status(201).json(newComment);
  } catch (error) {
    console.error("Comment creation error:", error);
    res
      .status(500)
      .json({ error: "حدث خطأ أثناء إضافة التعليق", details: error.message });
  }
});

router.post("/comment/reply", async (req, res) => {
  try {
    const { userId, seasonId, text, parentId } = req.body;

    if (!userId || !seasonId || !text || !parentId) {
      return res.status(400).json({
        message: "مطلوب معرف المستخدم، معرف الموسم، النص ومعرف التعليق الأب",
      });
    }

    const filteredText = await filterBannedWords(text);

    const reply = await Comments.create({
      userId,
      seasonId,
      text: filteredText,
      parentId,
    });

    const user = await Users.findByPk(userId);
    if (user) {
      await user.update({
        repliesCount: user.repliesCount + 1,
      });
    }

    const parentComment = await Comments.findByPk(parentId);
    if (parentComment) {
      await Notifications.create({
        userId: parentComment.userId,
        relatedId: parentComment.id,
        senderId: userId,
        message: `لديك رد جديد على تعليقك`,
        type: "reply",
      });
    }

    res.status(201).json(reply);
  } catch (error) {
    console.error("Reply creation error:", error);
    res
      .status(500)
      .json({ error: "حدث خطأ أثناء إضافة الرد", details: error.message });
  }
});

router.post("/comment/like/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const comment = await Comments.findByPk(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "لم يتم العثور على التعليق" });
    }

    const existingInteraction = await UserInteractions.findOne({
      where: {
        userId,
        commentId: comment.id,
      },
    });

    if (existingInteraction) {
      if (existingInteraction.likeType === "like") {
        await existingInteraction.destroy();
        comment.likes -= 1;
        await comment.save();

        return res.json({
          message: "تم إلغاء الإعجاب بالتعليق بنجاح",
          likes: comment.likes,
          dislikes: comment.dislikes,
          likeType: null,
        });
      } else if (existingInteraction.likeType === "dislike") {
        existingInteraction.likeType = "like";
        await existingInteraction.save();
        comment.likes += 1;
        comment.dislikes -= 1;
        await comment.save();

        if (userId !== comment.userId) {
          await Notifications.create({
            userId: comment.userId,
            senderId: userId,
            relatedId: comment.id,
            message: `لقد أعجب شخص بتعليقك`,
            type: "like",
          });
        }

        return res.json({
          message: "تم الإعجاب بالتعليق بنجاح",
          likes: comment.likes,
          dislikes: comment.dislikes,
          likeType: "like",
        });
      }
    }

    await UserInteractions.create({
      userId,
      commentId: comment.id,
      likeType: "like",
    });
    comment.likes += 1;
    await comment.save();

    res.json({
      message: "تم الإعجاب بالتعليق بنجاح",
      likes: comment.likes,
      dislikes: comment.dislikes,
      likeType: "like",
    });
  } catch (error) {
    console.error("Like comment error:", error);
    res
      .status(500)
      .json({ error: "حدث خطأ أثناء إعجاب التعليق", details: error.message });
  }
});

router.post("/comment/dislike/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const comment = await Comments.findByPk(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "لم يتم العثور على التعليق" });
    }

    const existingInteraction = await UserInteractions.findOne({
      where: {
        userId,
        commentId: comment.id,
      },
    });

    if (existingInteraction) {
      if (existingInteraction.likeType === "dislike") {
        await existingInteraction.destroy();
        comment.dislikes -= 1;
        await comment.save();

        return res.json({
          message: "تم إلغاء عدم الإعجاب بالتعليق بنجاح",
          likes: comment.likes,
          dislikes: comment.dislikes,
          likeType: null,
        });
      } else if (existingInteraction.likeType === "like") {
        existingInteraction.likeType = "dislike";
        await existingInteraction.save();
        comment.likes -= 1;
        comment.dislikes += 1;
        await comment.save();

        return res.json({
          message: "تم عدم الإعجاب بالتعليق بنجاح",
          likes: comment.likes,
          dislikes: comment.dislikes,
          likeType: "dislike",
        });
      }
    }

    await UserInteractions.create({
      userId,
      commentId: comment.id,
      likeType: "dislike",
    });

    comment.dislikes += 1;
    await comment.save();
    if (userId !== comment.userId) {
      await Notifications.create({
        userId: comment.userId,
        senderId: userId,
        message: `شخص ما لم يعجبه تعليقك`,
        type: "dislike",
      });
    }
    res.json({
      message: "تم عدم الإعجاب بالتعليق بنجاح",
      likes: comment.likes,
      dislikes: comment.dislikes,
      likeType: "dislike",
    });
  } catch (error) {
    console.error("Dislike comment error:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء عدم إعجاب التعليق",
      details: error.message,
    });
  }
});

router.post("/comment/reply/like/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const reply = await Comments.findByPk(req.params.id);

    if (!reply) {
      return res.status(404).json({ message: "لم يتم العثور على الرد" });
    }

    const parentComment = await Comments.findByPk(reply.parentId);

    const existingInteraction = await UserInteractions.findOne({
      where: {
        userId,
        commentId: reply.id,
      },
    });

    if (existingInteraction) {
      if (existingInteraction.likeType === "like") {
        await existingInteraction.destroy();
        reply.likes -= 1;
        await reply.save();

        return res.json({
          message: "تم إلغاء الإعجاب بالتعليق بنجاح",
          likes: reply.likes,
          dislikes: reply.dislikes,
          likeType: null,
        });
      } else if (existingInteraction.likeType === "dislike") {
        existingInteraction.likeType = "like";
        await existingInteraction.save();
        reply.likes += 1;
        reply.dislikes -= 1;
        await reply.save();

        if (userId !== reply.userId) {
          await Notifications.create({
            userId: reply.userId,
            senderId: userId,
            relatedId: parentComment.id,
            message: `لقد أعجب شخص بتعليقك`,
            type: "like",
          });
        }

        return res.json({
          message: "تم الإعجاب بالتعليق بنجاح",
          likes: reply.likes,
          dislikes: reply.dislikes,
          likeType: "like",
        });
      }
    }

    await UserInteractions.create({
      userId,
      commentId: reply.id,
      likeType: "like",
    });
    reply.likes += 1;
    await reply.save();

    res.json({
      message: "تم الإعجاب بالتعليق بنجاح",
      likes: reply.likes,
      dislikes: reply.dislikes,
      likeType: "like",
    });
  } catch (error) {
    console.error("Like comment error:", error);
    res
      .status(500)
      .json({ error: "حدث خطأ أثناء إعجاب التعليق", details: error.message });
  }
});

router.post("/comment/reply/dislike/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const reply = await Comments.findByPk(req.params.id);

    if (!reply) {
      return res.status(404).json({ message: "لم يتم العثور على الرد" });
    }

    const parentComment = await Comments.findByPk(reply.parentId);

    const existingInteraction = await UserInteractions.findOne({
      where: {
        userId,
        commentId: reply.id,
      },
    });

    if (existingInteraction) {
      if (existingInteraction.likeType === "dislike") {
        await existingInteraction.destroy();
        reply.dislikes -= 1;
        await reply.save();

        return res.json({
          message: "تم إلغاء عدم الإعجاب بالتعليق بنجاح",
          likes: reply.likes,
          dislikes: reply.dislikes,
          likeType: null,
        });
      } else if (existingInteraction.likeType === "like") {
        existingInteraction.likeType = "dislike";
        await existingInteraction.save();
        reply.likes -= 1;
        reply.dislikes += 1;
        await reply.save();

        return res.json({
          message: "تم عدم الإعجاب بالتعليق بنجاح",
          likes: reply.likes,
          dislikes: reply.dislikes,
          likeType: "dislike",
        });
      }
    }

    await UserInteractions.create({
      userId,
      commentId: reply.id,
      likeType: "dislike",
    });

    reply.dislikes += 1;
    await reply.save();
    if (userId !== reply.userId) {
      await Notifications.create({
        userId: reply.userId,
        senderId: userId,
        relatedId: parentComment.id,
        message: `لقد أعجب شخص بتعليقك`,
        type: "like",
      });
    }
    res.json({
      message: "تم عدم الإعجاب بالتعليق بنجاح",
      likes: reply.likes,
      dislikes: reply.dislikes,
      likeType: "dislike",
    });
  } catch (error) {
    console.error("Dislike comment error:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء عدم إعجاب التعليق",
      details: error.message,
    });
  }
});
router.post("/toggle-pin/:id", async (req, res) => {
  try {
    const comment = await Comments.findByPk(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "لم يتم العثور على التعليق" });
    }

    comment.isPinned = !comment.isPinned;
    await comment.save();

    const message = comment.isPinned
      ? "تم تثبيت التعليق بنجاح"
      : "تم إلغاء تثبيت التعليق بنجاح";

    res.json({ message, isPinned: comment.isPinned });
  } catch (error) {
    console.error("Toggle pin comment error:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء تغيير حالة التثبيت",
      details: error.message,
    });
  }
});
router.get("/:seasonId", async (req, res) => {
  try {
    const { seasonId } = req.params;
    const { userId } = req.query;

    const comments = await Comments.findAndCountAll({
      where: { seasonId, parentId: null },
      include: [
        {
          model: Users,
          attributes: ["id", "username", "avatar", "role", "isAdmin"],
        },
        {
          model: Comments,
          as: "replies",
          required: false,
          include: [
            {
              model: Users,
              attributes: ["id", "username", "avatar", "role", "isAdmin"],
            },
          ],
        },
        {
          model: UserInteractions,
          where: { userId },
          required: false,
          attributes: ["likeType"],
        },
      ],

      order: [
        ["isPinned", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit: 10,
      offset: 0,
    });

    const commentsWithDetails = await Promise.all(
      comments.rows.map(async (comment) => {
        const replyCount = await Comments.count({
          where: { parentId: comment.id },
        });

        const userInteraction = comment.UserInteractions[0];
        const likeType = userInteraction ? userInteraction.likeType : null;

        return {
          ...comment.toJSON(),
          timeAgo: getTimeAgo(comment.createdAt),
          replyCount,
          userLikeType: likeType,
          isPinned: comment.isPinned || false,
        };
      })
    );
    res.json({
      totalComments: comments.count,
      comments: commentsWithDetails,
    });
  } catch (error) {
    console.error("Fetching comments error:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء جلب التعليقات",
      details: error.message,
    });
  }
});

router.get("/comment/:commentId/replies", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: replies } = await Comments.findAndCountAll({
      where: {
        parentId: commentId,
      },
      include: [
        {
          model: Users,
          attributes: ["id", "username", "avatar", "role", "isAdmin"],
        },
        {
          model: UserInteractions,
          where: { userId },
          required: false,
          attributes: ["likeType"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const repliesWithDetails = await Promise.all(
      replies.map(async (reply) => {
        const replyCount = await Comments.count({
          where: { parentId: reply.id },
        });

        const userInteraction = reply.UserInteractions[0];
        const likeType = userInteraction ? userInteraction.likeType : null;

        return {
          ...reply.toJSON(),
          timeAgo: getTimeAgo(reply.createdAt),
          replyCount,
          userLikeType: likeType,
          isPinned: reply.isPinned || false,
        };
      })
    );

    const totalPages = Math.ceil(count / limit);

    res.json({
      data: repliesWithDetails,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching replies:", error);
    res
      .status(500)
      .json({ error: "حدث خطأ أثناء جلب الردود", details: error.message });
  }
});

router.delete("/comment/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const comment = await Comments.findByPk(id, {
      include: [{ model: Users, attributes: ["id", "isAdmin"] }],
    });

    if (!comment) {
      return res.status(404).json({ message: "لم يتم العثور على التعليق" });
    }

    if (comment.userId !== userId && !comment.User.isAdmin) {
      return res
        .status(403)
        .json({ message: "ليس لديك صلاحية لحذف هذا التعليق" });
    }

    await Comments.destroy({ where: { parentId: id } });

    await comment.destroy();
    const user = await Users.findByPk(userId);
    if (user) {
      await user.update({
        commentsCount: user.commentsCount - 1,
      });
    }
    res.json({ message: "تم حذف التعليق بنجاح" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء حذف التعليق",
      details: error.message,
    });
  }
});

router.delete("/comment/reply/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const reply = await Comments.findByPk(id, {
      include: [{ model: Users, attributes: ["id", "isAdmin"] }],
    });

    if (!reply) {
      return res.status(404).json({ message: "لم يتم العثور على الرد" });
    }

    if (reply.userId !== userId && !reply.User.isAdmin) {
      return res.status(403).json({ message: "ليس لديك صلاحية لحذف هذا الرد" });
    }
    await Comments.destroy({ where: { parentId: id } });
    await reply.destroy();

    res.json({ message: "تم حذف الرد بنجاح" });
  } catch (error) {
    console.error("Delete reply error:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء حذف الرد",
      details: error.message,
    });
  }
});

router.put("/comment/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, text, isSpoiler } = req.body;

    const comment = await Comments.findOne({
      where: { id, userId },
    });

    if (!comment) {
      return res
        .status(404)
        .json({ message: "التعليق غير موجود أو لا يمكنك تعديله" });
    }

    const filteredText = await filterBannedWords(text);

    await comment.update({
      text: filteredText,
      isSpoiler: isSpoiler || false,
      isEdited: true,
    });

    const updatedComment = await Comments.findOne({
      where: { id },
      include: [
        {
          model: Users,
          attributes: ["id", "username", "avatar", "role", "isAdmin"],
        },
        {
          model: UserInteractions,
          where: { userId },
          required: false,
          attributes: ["likeType"],
        },
      ],
    });

    const replyCount = await Comments.count({
      where: { parentId: id },
    });

    const userInteraction = updatedComment.UserInteractions[0];
    const likeType = userInteraction ? userInteraction.likeType : null;

    const response = {
      ...updatedComment.toJSON(),
      timeAgo: getTimeAgo(updatedComment.createdAt),
      replyCount,
      userLikeType: likeType,
      isPinned: updatedComment.isPinned || false,
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating comment:", error);
    res
      .status(500)
      .json({ error: "حدث خطأ أثناء تعديل التعليق", details: error.message });
  }
});

router.put("/comment/reply/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, text, isSpoiler } = req.body;

    const reply = await Comments.findOne({
      where: {
        id,
        userId,
        parentId: { [Op.not]: null },
      },
    });

    if (!reply) {
      return res
        .status(404)
        .json({ message: "الرد غير موجود أو لا يمكنك تعديله" });
    }

    const filteredText = await filterBannedWords(text);

    await reply.update({
      text: filteredText,
      isSpoiler: isSpoiler || false,
      isEdited: true,
    });

    const updatedReply = await Comments.findOne({
      where: { id },
      include: [
        {
          model: Users,
          attributes: ["id", "username", "avatar", "role", "isAdmin"],
        },
        {
          model: UserInteractions,
          where: { userId },
          required: false,
          attributes: ["likeType"],
        },
      ],
    });

    const replyCount = await Comments.count({
      where: { parentId: id },
    });

    const userInteraction = updatedReply.UserInteractions[0];
    const likeType = userInteraction ? userInteraction.likeType : null;

    const response = {
      ...updatedReply.toJSON(),
      timeAgo: getTimeAgo(updatedReply.createdAt),
      replyCount,
      userLikeType: likeType,
      isPinned: updatedReply.isPinned || false,
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating reply:", error);
    res
      .status(500)
      .json({ error: "حدث خطأ أثناء تعديل الرد", details: error.message });
  }
});

module.exports = router;
