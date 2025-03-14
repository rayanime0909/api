const express = require('express');
const router = express.Router();
const { Favorites, News, Recommendations, Seasons, Users } = require("../database");
const { Op } = require("sequelize");
const jwt = require('jsonwebtoken');

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
  

router.post('/add', async (req, res) => {
    try {
        const { userId, itemId, itemType } = req.body;
    
        if (!userId || !itemId || !itemType) {
            return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
        }
    
        console.log(`Adding to favorites: userId=${userId}, itemId=${itemId}, itemType=${itemType}`);
    
        const userExists = await Users.findByPk(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }
    
        let item;
        switch (itemType) {
            case 'news':
                item = await News.findByPk(itemId);
                break;
            case 'recommendations':
                item = await Recommendations.findByPk(itemId);
                break;
            case 'seasons':
                item = await Seasons.findByPk(itemId);
                break;
            default:
                return res.status(400).json({ message: 'نوع العنصر غير صالح' });
        }
    
        if (!item) {
            return res.status(404).json({ message: 'العنصر غير موجود' });
        }
    
        await Favorites.create({ userId, itemId, itemType });
        return res.status(201).json({ message: 'تمت إضافة العنصر إلى المفضلة بنجاح' });
    } catch (error) {
        console.error('Error adding to favorites:', error);
        return res.status(500).json({ message: 'حدث خطأ أثناء الإضافة إلى المفضلات', error: error.message });
    }
});

router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const favorites = await Favorites.findAll({
            where: { userId },
            include: [
                {
                    model: News,
                    as: "NewsItem",
                    include: [
                        {
                            model: Users,
                            as: "User",
                            attributes: ["id", "username", "avatar", "role", "isAdmin"]
                        }
                    ]
                },
                {
                    model: Recommendations,
                    as: "RecommendationItem"
                },
                {
                    model: Seasons,
                    as: "SeasonItem"
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        const formattedFavorites = [];
        favorites.forEach((favorite) => {
            if (favorite.NewsItem) {
                if (Array.isArray(favorite.NewsItem)) {
                    formattedFavorites.push(...favorite.NewsItem.map(item => item.toJSON()));
                } else {
                    formattedFavorites.push(favorite.NewsItem.toJSON());
                }
            }
            if (favorite.RecommendationItem) {
                if (Array.isArray(favorite.RecommendationItem)) {
                    formattedFavorites.push(...favorite.RecommendationItem.map(item => item.toJSON()));
                } else {
                    formattedFavorites.push(favorite.RecommendationItem.toJSON());
                }
            }
            if (favorite.SeasonItem) {
                if (Array.isArray(favorite.SeasonItem)) {
                    formattedFavorites.push(...favorite.SeasonItem.map(item => item.toJSON()));
                } else {
                    formattedFavorites.push(favorite.SeasonItem.toJSON());
                }
            }
        });

        res.status(200).json({ favorites: formattedFavorites });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'حدث خطأ أثناء جلب قائمة المفضلات' });
    }
});


router.get('/:userId/count', async (req, res) => {
    try {
        const { userId } = req.params;

        const count = await Favorites.count({
            where: { userId },
            include: [
                {
                    model: News,
                    as: 'NewsItem'
                },
                {
                    model: Recommendations,
                    as: 'RecommendationItem'
                },
                {
                    model: Seasons,
                    as: 'SeasonItem'
                }
            ]
        });

        res.status(200).json({ count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'حدث خطأ أثناء جلب عدد المحفوظات' });
    }
});


router.delete('/remove', async (req, res) => {
    try {
        const { userId, itemId, itemType } = req.body;

        if (!userId || !itemId || !itemType) {
            return res.status(400).json({ message: 'الرجاء توفير userId و itemId و itemType' });
        }

        
        const validItemTypes = ['news', 'recommendations', 'seasons'];
        if (!validItemTypes.includes(itemType)) {
            return res.status(400).json({ message: 'نوع العنصر غير صالح' });
        }

       
        const result = await Favorites.destroy({
            where: {
                userId,
                itemId,
                itemType
            }
        });

        if (result) {
            res.status(200).json({ message: 'تمت إزالة العنصر من المفضلات' });
        } else {
            res.status(404).json({ message: 'العنصر غير موجود في المفضلات' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'حدث خطأ أثناء إزالة العنصر من المفضلات' });
    }
});


router.get('/is-favorite/:userId/:itemId/:itemType', async (req, res) => {
    try {
        const { userId, itemId, itemType } = req.params;

        if (!userId || !itemId || !itemType) {
            return res.status(400).json({ message: 'الرجاء توفير userId و itemId و itemType' });
        }

        const validItemTypes = ['news', 'recommendations', 'seasons'];
        if (!validItemTypes.includes(itemType)) {
            return res.status(400).json({ message: 'نوع العنصر غير صالح' });
        }

        const favorite = await Favorites.findOne({
            where: { userId, itemId, itemType }
        });

        res.status(200).json({ isFavorite: !!favorite });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'حدث خطأ أثناء التحقق من حالة العنصر' });
    }
});

router.post('/toggle-favorite',authenticateJWT, async (req, res) => {
    try {
        const {itemId, itemType } = req.body;
        const userId = req.user.userId;
        
        if (!itemId || !itemType) {
            return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
        }

      
        const user = await Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }

      
        let item;
        switch (itemType) {
            case 'news':
                item = await News.findByPk(itemId);
                break;
            case 'recommendations':
                item = await Recommendations.findByPk(itemId);
                break;
            case 'seasons':
                item = await Seasons.findByPk(itemId);
                break;
            default:
                return res.status(400).json({ message: 'نوع العنصر غير صالح' });
        }

        if (!item) {
            return res.status(404).json({ message: 'العنصر غير موجود' });
        }

        const existingFavorite = await Favorites.findOne({
            where: {
                userId,
                itemId,
                itemType
            }
        });

        if (existingFavorite) {
            await existingFavorite.destroy();
            res.status(200).json({ 
                message: 'تمت إزالة العنصر من المفضلات',
                isFavorite: false
            });
        } else {
            await Favorites.create({
                userId,
                itemId,
                itemType
            });
            res.status(201).json({ 
                message: 'تمت الإضافة إلى المفضلات',
                isFavorite: true
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'حدث خطأ أثناء معالجة الطلب' });
    }
});
module.exports = router;