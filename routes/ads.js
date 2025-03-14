const express = require("express");
const router = express.Router();
const { Ad, UserAdPreference,MaxAdsCount, sequelize } = require("../database");
const ALLOWED_TYPES = ["interstitial", "rewarded", "native_video"];
const sendResponse = (res, status, message, data = null) => {
    const response = { message };
    if (data) response.data = data;
    return res.status(status).json(response);
};
router.post("/create", async (req, res) => {
    const { type, content } = req.body;

    if (!type || !content) {
        return res.status(400).json({ error: "Type and content are required." });
    }

    if (!ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({ error: "Invalid type. Allowed types are: interstitial, rewarded, native_video." });
    }

    try {
        const newAd = await Ad.create({ type, content });
        res.json({ message: "Ad created successfully.", ad: newAd });
    } catch (error) {
        res.status(500).json({ error: "Failed to create ad." });
    }
});

router.get("/random", async (req, res) => {
    const { type, userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
    }

    const userPreference = await UserAdPreference.findOne({ where: { userId } });
    if (userPreference?.disabled) {
        return res.json({ message: "Ads are disabled for this user." });
    }

    if (!type) {
        return res.status(400).json({ error: "Ad type is required." });
    }

    if (!ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({ error: "Invalid type. Allowed types are: Interstitial Ads, Rewarded Ads, Native Video Ads." });
    }

    try {
        const ad = await Ad.findOne({ where: { type }, order: sequelize.random() });
        
        if (!ad) {
            return res.status(404).json({ error: "No ads found for the specified type." });
        }
        
        res.json({ ad });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch ad." });
    }
});

router.post("/setMaxAds", async (req, res) => {
    const { maxAds } = req.body;

    if (!maxAds || isNaN(maxAds) || maxAds <= 0) {
        return res.status(400).json({ error: "Invalid maxAds. It must be a positive number." });
    }

    try {
        await MaxAdsCount.upsert({ key: "maxAdsCount", value: maxAds });

        res.json({ message: `maxAdsCount updated to ${maxAds}` });
    } catch (error) {
        console.error("Error updating maxAdsCount:", error);
        res.status(500).json({ error: "Failed to update maxAdsCount." });
    }
});

router.get("/getMaxAds", async (req, res) => {
    try {
        const maxAdsEntry = await MaxAdsCount.findOne({ where: { key: "maxAdsCount" } });

        if (!maxAdsEntry) {
            return res.status(404).json({ error: "maxAdsCount not found." });
        }

        res.json({ maxAds: maxAdsEntry.value });
    } catch (error) {
        console.error("Error fetching maxAdsCount:", error);
        res.status(500).json({ error: "Failed to fetch maxAdsCount." });
    }
});

router.post("/disable", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
    }

    try {
        await UserAdPreference.upsert({ userId, disabled: true });
        res.json({ message: "Ads disabled for the user." });
    } catch (error) {
        res.status(500).json({ error: "Failed to disable ads." });
    }
});

router.post("/enable", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
    }

    try {
        await UserAdPreference.upsert({ userId, disabled: false });
        res.json({ message: "Ads enabled for the user." });
    } catch (error) {
        res.status(500).json({ error: "Failed to enable ads." });
    }
});

module.exports = router;
