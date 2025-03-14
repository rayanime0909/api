const admin = require("firebase-admin");
const bucket = admin.storage().bucket();

async function uploadImage(userId, file) {
  const fileName = `profiles/${userId}/${file.originalname}`;
  const fileRef = bucket.file(fileName);

  await fileRef.save(file.buffer, { metadata: { contentType: file.mimetype } });

  return fileRef.publicUrl();
}

module.exports = { uploadImage };
