const admin = require("firebase-admin");
const { sequelize } = require("./database");
const cors = require("cors");
const path = require("path");
const passport = require('passport');

(async () => {
  await sequelize.sync();
  console.log("تم تهيئة قاعدة البيانات!");
})();

const express = require("express");
const { authenticate } = require("./routes/auth");
const authRoutes = require("./routes/auth").router;

const serviceAccount = require("./serviceAccountKey.json");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.get("/", (req, res) => {
  res.redirect("/admin/login.html");
});

app.get("/admin/panel", authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "index.html"));
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


const newsRoutes = require("./routes/news");
const recommendationsRoutes = require("./routes/recommendations");
const seasonsRoutes = require("./routes/seasons");
const homeRoutes = require("./routes/home");
const searchRoutes = require("./routes/search");
const topNewsRoutes = require("./routes/latestAndBestNews");
const commentsRoutes = require("./routes/comments");
const userRoutes = require("./routes/users");
const favoritesRoutes = require("./routes/favorites");
const bannedWordsRoutes = require("./routes/bannedWords");
const notificationsRoutes = require("./routes/notifications");
const ratingsRoutes = require("./routes/ratings");
const adsRoutes = require("./routes/ads");
const dashboardRoutes = require("./routes/dashboard");
const socialMediaRoutes = require("./routes/socialMedia");
const welcomeMessageRoutes = require("./routes/welcomeMessage");

app.use(passport.initialize());

app.use("/notifications", notificationsRoutes);
app.use('/auth', authRoutes);
app.use("/social-media", socialMediaRoutes);

app.use("/news", newsRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/recommendations", recommendationsRoutes);
app.use("/seasons", seasonsRoutes);
app.use("/home", homeRoutes);
app.use("/search", searchRoutes);
app.use("/featured-news", topNewsRoutes);
app.use("/comments", commentsRoutes);
app.use("/users", userRoutes);
app.use("/favorites", favoritesRoutes);
app.use("/banned-words", bannedWordsRoutes);
app.use("/ratings", ratingsRoutes);
app.use("/ads", adsRoutes);
app.use("/welcome-messages", welcomeMessageRoutes);

const PORT = 3000;
app.listen(PORT,'192.168.51.146', () => {
    console.log(`Server is running on http://192.168.51.146:${PORT}`);
});
