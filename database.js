const { Sequelize, Op, DataTypes } = require("sequelize");
const sqlite3 = require('sqlite3').verbose();

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./anime-app.db",
  logging: false,
  dialectOptions: {
    mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    flags: ['OPEN_READWRITE', 'OPEN_CREATE'],
  }
});

const News = sequelize.define("News", {
  id: { type: DataTypes.STRING, primaryKey: true },
  routes: { type: DataTypes.STRING, defaultValue: "news" },
  date: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: () => {
      const now = new Date();
      return now.toISOString().split("T")[0];
    },
  },
  content: { type: DataTypes.TEXT, allowNull: false },
  image: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  timestamp: { type: DataTypes.BIGINT, allowNull: false },
  numRaters: { type: DataTypes.STRING, defaultValue: "0" },
  overallRating: { type: DataTypes.STRING, defaultValue: "0" },
  publisherId: { type: DataTypes.STRING, allowNull: false },
  views: { type: DataTypes.INTEGER, defaultValue: 0 },
  allowAds: { type: DataTypes.BOOLEAN, defaultValue: true },
  totalScore: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalRaters: { type: DataTypes.INTEGER, defaultValue: 0 },
  averageScore: { type: DataTypes.FLOAT, defaultValue: 0 },
});

const Recommendations = sequelize.define("Recommendations", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  url: { type: DataTypes.STRING },
  mal_id: { type: DataTypes.STRING },
  allowAds: { type: DataTypes.BOOLEAN, defaultValue: true },
  routes: { type: DataTypes.STRING, defaultValue: "recommendations" },
  publisherId: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING },
  title_english: { type: DataTypes.STRING },
  imageUrl: { type: DataTypes.STRING },
  studio: { type: DataTypes.TEXT },
  genres: { type: DataTypes.TEXT },
  episodes: { type: DataTypes.INTEGER },
  season: { type: DataTypes.STRING },
  year: { type: DataTypes.INTEGER },
  age: { type: DataTypes.STRING },
  aired_from: { type: DataTypes.STRING },
  aired_to: { type: DataTypes.STRING },
  trailer: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING },
  duration: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },
  source: { type: DataTypes.STRING },
  summary: { type: DataTypes.TEXT },
  views: { type: DataTypes.INTEGER },
  date: { type: DataTypes.STRING },
  score: { type: DataTypes.STRING },
  scored_by: { type: DataTypes.STRING },
  rank: { type: DataTypes.STRING },
  popularity: { type: DataTypes.STRING },
  members: { type: DataTypes.STRING },
  favorites: { type: DataTypes.STRING },
  totalScore: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalRaters: { type: DataTypes.INTEGER, defaultValue: 0 },
  averageScore: { type: DataTypes.FLOAT, defaultValue: 0 },
});

const Seasons = sequelize.define("Seasons", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  url: { type: DataTypes.STRING },
  mal_id: { type: DataTypes.STRING },
  allowAds: { type: DataTypes.BOOLEAN, defaultValue: true },
  routes: { type: DataTypes.STRING, defaultValue: "seasons" },
  publisherId: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING },
  title_english: { type: DataTypes.STRING },
  imageUrl: { type: DataTypes.STRING },
  studio: { type: DataTypes.TEXT },
  genres: { type: DataTypes.TEXT },
  episodes: { type: DataTypes.INTEGER },
  season: { type: DataTypes.STRING },
  year: { type: DataTypes.INTEGER },
  age: { type: DataTypes.STRING },
  aired_from: { type: DataTypes.STRING },
  aired_to: { type: DataTypes.STRING },
  trailer: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING },
  duration: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },
  source: { type: DataTypes.STRING },
  summary: { type: DataTypes.TEXT },
  views: { type: DataTypes.INTEGER },
  date: { type: DataTypes.STRING },
  score: { type: DataTypes.STRING },
  scored_by: { type: DataTypes.STRING },
  rank: { type: DataTypes.STRING },
  popularity: { type: DataTypes.STRING },
  members: { type: DataTypes.STRING },
  favorites: { type: DataTypes.STRING },
  totalScore: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalRaters: { type: DataTypes.INTEGER, defaultValue: 0 },
  averageScore: { type: DataTypes.FLOAT, defaultValue: 0 },
});

const Ratings = sequelize.define("Ratings", {
  userId: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  itemId: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false },
});

const Comments = sequelize.define(
  "Comment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    seasonId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isSpoiler: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    dislikes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Users = sequelize.define("User", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  loginMethod: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "email",
    validate: {
      isIn: [["email", "google"]],
    }
  },
  bio: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue:
      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
  },
  backgroundImage: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue:
      "",
  },
  repliesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  ratingsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  commentsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isBanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  role: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
});

const UserInteractions = sequelize.define("UserInteractions", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  likeType: {
    type: DataTypes.ENUM("like", "dislike"),
    allowNull: false,
  },

  timestamps: true,
});

const Favorites = sequelize.define('Favorites', {
  userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
  },
  itemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
  },
  itemType: {
      type: DataTypes.STRING,
      allowNull: true, 
  },
}, {
  tableName: 'favorites',
  timestamps: true,
});

const BannedWords = sequelize.define("BannedWords", {
  word: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  addedBy: {
    type: DataTypes.STRING, 
    allowNull: false,
  },
}, {
  timestamps: true,
});

const Notifications = sequelize.define("Notifications", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  senderId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  relatedId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
}, {
  timestamps: true,
});

const Reports = sequelize.define("Reports", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  commentId: { 
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reporterId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  reason: { 
    type: DataTypes.STRING,
    allowNull: false,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
});

const Ad = sequelize.define("Ad", {
  id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
  },
  type: {
      type: DataTypes.STRING,
      allowNull: false,
  },
  content: {
      type: DataTypes.TEXT,
      allowNull: false,
  },
}, {
  timestamps: true,
});

const UserAdPreference = sequelize.define("UserAdPreference", {
  userId: {
      type: DataTypes.STRING,
      primaryKey: true,
  },
  disabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
  },
}, {
  timestamps: false,
});

const SocialMedia = sequelize.define("SocialMedia", {
  id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
  },
  officialWebsite: {
      type: DataTypes.STRING,
      allowNull: true,
  },
  youtube: {
      type: DataTypes.STRING,
      allowNull: true,
  },
  instagram: {
      type: DataTypes.STRING,
      allowNull: true,
  },
  facebook: {
      type: DataTypes.STRING,
      allowNull: true,
  },
  privacyPolicy: {
      type: DataTypes.STRING,
      allowNull: true,
  },
  termsOfUse: {
      type: DataTypes.STRING,
      allowNull: true,
  },
}, {
  timestamps: false,
});

const MaxAdsCount = sequelize.define("MaxAdsCount", {
  key: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: "maxAdsCount",
  },
  value: {
      type: DataTypes.INTEGER,
      allowNull: false,
  },
}, {
  tableName: "Settings",
  timestamps: false,
});

const WelcomeMessage = sequelize.define("WelcomeMessage", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "عنوان الرسالة الترحيبية",
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: "النص الكامل للرسالة الترحيبية",
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "الشخص الذي قام بإنشاء الرسالة",
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: "حالة تفعيل الرسالة الترحيبية",
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "رابط الصورة المرتبطة بالرسالة",
  },
  downloadUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "رابط تحميل الملف المرتبط بالرسالة",
  }
});


Notifications.belongsTo(Users, { foreignKey: "senderId" });
Users.hasMany(Notifications, { foreignKey: "userId" });


UserInteractions.belongsTo(Comments, { foreignKey: "commentId" });
Comments.hasMany(UserInteractions, { foreignKey: "commentId" });

Users.hasMany(Comments, { foreignKey: "userId" });
Comments.belongsTo(Users, { foreignKey: "userId" });

Comments.hasMany(Comments, {
foreignKey: "parentId",
  as: "replies",
  onDelete: "CASCADE",
});
Comments.belongsTo(Comments, {
  foreignKey: "parentId",
  as: "parent",
  onDelete: "CASCADE",
});


Notifications.belongsTo(Comments, {
  foreignKey: 'id', 
  as: 'comment', 
});
Comments.hasMany(Notifications, {
  foreignKey: 'id',
  as: 'notifications',
});

UserInteractions.belongsTo(Users, { foreignKey: 'userId' });

News.belongsTo(Users, { foreignKey: "publisherId", as: "User" });
Users.hasMany(News, { foreignKey: "publisherId", as: "news" });

Users.hasMany(Favorites, { foreignKey: "userId" });
Favorites.belongsTo(Users, { foreignKey: "userId" });

Favorites.belongsTo(News, { foreignKey: 'itemId', constraints: false, as: 'NewsItem' });
News.hasMany(Favorites, { foreignKey: 'itemId', as: 'Favorites' });

Favorites.belongsTo(Recommendations, { foreignKey: 'itemId', constraints: false, as: 'RecommendationItem' });
Recommendations.hasMany(Favorites, { foreignKey: 'itemId', as: 'Favorites' });

Favorites.belongsTo(Seasons, { foreignKey: 'itemId', constraints: false, as: 'SeasonItem' });
Seasons.hasMany(Favorites, { foreignKey: 'itemId', as: 'Favorites' });

BannedWords.belongsTo(Users, { foreignKey: "addedBy", as: "User" });
Users.hasMany(BannedWords, { foreignKey: "addedBy", as: "BannedWords"});

Reports.belongsTo(Comments, { foreignKey: "commentId", as: "ReportedComment" });
Comments.hasMany(Reports, { foreignKey: "commentId", as: "Reports" });

Reports.belongsTo(Users, { foreignKey: "reporterId", as: "Reporter" });
Users.hasMany(Reports, { foreignKey: "reporterId", as: "ReportsByUser" });


Users.hasMany(Seasons, {
  foreignKey: "publisherId", // المفتاح الخارجي المستخدم للربط
  as: "Seasons", // الاسم المستعار
});
Seasons.belongsTo(Users, {
  foreignKey: "publisherId", // المفتاح الخارجي المستخدم للربط
  as: "User", // الاسم المستعار المستخدم في الاستعلام
});


module.exports = {
  sequelize,
  Op,
  News,
  Recommendations,
  Seasons,
  Ratings,
  Comments,
  Users,
  UserInteractions,
  Favorites,
  BannedWords,
  Notifications,
  Ad,
  UserAdPreference,
  SocialMedia,
  MaxAdsCount,
  WelcomeMessage,
  Reports
};
