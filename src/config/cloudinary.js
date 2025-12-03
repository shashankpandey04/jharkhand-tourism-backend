import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (filePath, folder = "jharkhand") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });
    return result; // result.secure_url, result.public_id
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw err;
  }
};

export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (err) {
    console.error("Cloudinary deletion error:", err);
    throw err;
  }
};

export const getImageUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, options);
};

