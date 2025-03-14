const express = require('express');
const router = express.Router();
const { Notifications, Users, Comments, UserInteractions } = require('../database');
const moment = require('moment');

const NOTIFICATION_TYPES = {
  COMMENT_REPLY: 'COMMENT_REPLY',
  COMMENT_LIKE: 'COMMENT_LIKE',
  COMMENT_DISLIKE: 'COMMENT_DISLIKE',
  MENTION: 'MENTION'
};
const getTimeAgo = (date) => {
    moment.locale("ar"); 
    const result = moment(date).fromNow(); 
    moment.locale("en");
    return result;
  };
async function createNotification(userId, message, type, relatedId = null) {
  try {
    return await Notifications.create({
      userId,
      message,
      type,
      relatedId,
      timestamp: new Date(),
      isRead: false
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

router.post('/', async (req, res) => {
    try {
        const { userId, message, type, relatedId } = req.body;
        
        if (!type || !Object.values(NOTIFICATION_TYPES).includes(type)) {
          return res.status(400).json({
            error: 'نوع الإشعار غير صالح',
          });
        }
    
        const newNotification = await createNotification(userId, message, type, relatedId);
        res.status(201).json(newNotification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
          error: 'حدث خطأ أثناء إضافة الإشعار',
          details: error.message,
        });
    }
});

router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        const offset = (page - 1) * limit;
        
        const notifications = await Notifications.findAndCountAll({
            where: { userId },
            order: [['timestamp', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [
                {
                    model: Users,
                    attributes: ["id", "username", "avatar", "role", "isAdmin"],
                },
                {
                    model: Comments,
                    as: 'comment',
                    required: false,
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
                },
            ]
        });

         const notificationsWithDetails = await Promise.all(
            notifications.rows.map(async (notification) => {
                const comment = notification.comment || {}; 
            

                const userInteraction = comment.UserInteractions && comment.UserInteractions[0];
                const likeType = userInteraction ? userInteraction.likeType : null;

                return {
                    ...notification.toJSON(),
                    timeAgo: getTimeAgo(notification.timestamp), 
                    userLikeType: likeType,
                    isPinned: comment.isPinned || false, 
                };
            })
        );

        const hasUnread = await Notifications.findOne({
            where: { userId, isRead: false }
        });

    
        
        res.json({
            notifications: notificationsWithDetails,
            total: notifications.count,
            currentPage: parseInt(page),
            totalPages: Math.ceil(notifications.count / limit),
            hasUnread: !!hasUnread
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            error: 'حدث خطأ أثناء جلب الإشعارات',
            details: error.message
        });
    }
});

router.put('/user/:userId/read-all', async (req, res) => {
    try {
        const { userId } = req.params;

        const updatedNotifications = await Notifications.update(
            { isRead: true },
            {
                where: { userId, isRead: false },
            }
        );

        if (updatedNotifications[0] === 0) {
            return res.status(404).json({ error: 'لا توجد إشعارات غير مقروءة' });
        }

        res.json({ message: 'تم تحديث جميع الإشعارات إلى مقروءة' });
    } catch (error) {
        console.error('Error updating all notifications to read:', error);
        res.status(500).json({
            error: 'حدث خطأ أثناء تحديث الإشعارات',
            details: error.message
        });
    }
});

router.delete('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const deletedNotifications = await Notifications.destroy({
            where: { userId }
        });

        if (deletedNotifications === 0) {
            return res.status(404).json({ error: 'لا توجد إشعارات لحذفها' });
        }

        res.json({ message: 'تم حذف جميع الإشعارات بنجاح' });
    } catch (error) {
        console.error('Error deleting all notifications:', error);
        res.status(500).json({
            error: 'حدث خطأ أثناء حذف الإشعارات',
            details: error.message
        });
    }
});

router.get('/user/:userId/unread-status', async (req, res) => {
    try {
        const { userId } = req.params;

        const unreadCount = await Notifications.count({
            where: { userId, isRead: false }
        });

        res.json({
            hasUnread: unreadCount > 0, 
            unreadCount: unreadCount > 9 ? '9+' : unreadCount
        });
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
        res.status(500).json({
            error: 'حدث خطأ أثناء جلب حالة الإشعارات',
            details: error.message
        });
    }
});
router.put('/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        const notification = await Notifications.findByPk(notificationId);
        if (!notification) {
            return res.status(404).json({ error: 'الإشعار غير موجود' });
        }
        
        notification.isRead = true;
        await notification.save();
        
        res.json(notification);
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({
            error: 'حدث خطأ أثناء تحديث حالة الإشعار',
            details: error.message
        });
    }
});

router.delete('/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        const notification = await Notifications.findByPk(notificationId);
        if (!notification) {
            return res.status(404).json({ error: 'الإشعار غير موجود' });
        }
        
        await notification.destroy();
        res.json({ message: 'تم حذف الإشعار بنجاح' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            error: 'حدث خطأ أثناء حذف الإشعار',
            details: error.message
        });
    }
});


router.delete('/user/:userId/all', async (req, res) => {
    try {
        const { userId } = req.params;

        const deletedNotifications = await Notifications.destroy({
            where: { userId }
        });

        if (deletedNotifications === 0) {
            return res.status(404).json({ error: 'لا توجد إشعارات لهذا المستخدم لحذفها' });
        }

        res.json({ message: 'تم حذف جميع الإشعارات الخاصة بالمستخدم بنجاح' });
    } catch (error) {
        console.error('Error deleting all notifications for user:', error);
        res.status(500).json({
            error: 'حدث خطأ أثناء حذف الإشعارات',
            details: error.message
        });
    }
});

module.exports = router;
