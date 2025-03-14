const express = require("express");
const router = express.Router();
const { SocialMedia } = require("../database");

router.put("/update", async (req, res) => {
    const { officialWebsite, youtube, instagram, facebook, privacyPolicy, termsOfUse } = req.body;

    try {
        let socialMedia = await SocialMedia.findOne({ where: { id: 1 } });

        if (!socialMedia) {
            socialMedia = await SocialMedia.create({
                id: 1,
                officialWebsite,
                youtube,
                instagram,
                facebook,
                privacyPolicy,
                termsOfUse
            });
            return res.json({ message: "Social media links created successfully.", links: socialMedia });
        }

        const [updatedCount] = await SocialMedia.update({
            officialWebsite,
            youtube,
            instagram,
            facebook,
            privacyPolicy,
            termsOfUse
        }, { where: { id: 1 } });

        if (updatedCount > 0) {
            res.json({ message: "Social media links updated successfully." });
        } else {
            res.status(400).json({ error: "No changes made. Please check the data." });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to update social media links." });
    }
});


router.get("/", async (req, res) => {
    try {
        const links = await SocialMedia.findOne({ where: { id: 1 } });
        if (!links) {
            return res.status(404).json({ error: "No social media links found." });
        }
        res.json({ links });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch social media links." });
    }
});

module.exports = router;
