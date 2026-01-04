import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { console } from "inspector";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnClodinary = async (forwhat, localFilePath) => {
  try {
    if (!localFilePath) {
      console.log("No file path provided");
      return null;
    }
    function getResourceType(localFilePath) {
      const fileExtension = path.extname(localFilePath).toLowerCase();

      // Check for image file types
      const imageExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".bmp",
        ".webp",
      ];

      return imageExtensions.includes(fileExtension) ? "image" : "raw";
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: `chat-app/${forwhat}`,
      resource_type: getResourceType(localFilePath),
    });

    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    console.error("Cloudinary Upload Error: ", error);
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async (cloudinarypath) => {
  try {
    const part = cloudinarypath.split("/");
    const folder = part[part.length - 2];
    const file = part[part.length - 1].split(".")[0];

    const deletref = await cloudinary.uploader.destroy(
      `chat-app/${folder}/${file}`
    );
    if (deletref.result !== "ok") {
      console.log("Cloudinary Delete Error: ", deletref.result);
      return null;
    }

    return deletref;
  } catch (error) {
    console.error("Cloudinary Delete Error: ", error);
    return null;
  }
};

const fileDownload = async (req, res) => {
  try {
    const { fileUrl: cloudinarypath } = req.body;

    const part = cloudinarypath.split("/");
    const folder = part[part.length - 2];
    const file = part[part.length - 1].split(".")[0];

    const ext = path.extname(cloudinarypath).toLowerCase();
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
    const resourceType = imageExtensions.includes(ext) ? "image" : "raw";

    const signedUrl = cloudinary.utils.private_download_url(
      `chat-app/${folder}/${file}`,
      {
        resource_type: resourceType,
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
    );

    res.json({ signedUrl });
  } catch (error) {
    console.error("Cloudinary Download Error: ", error);
    res.status(500).json({ error: "Failed to generate download URL" });
  }
};

export { uploadOnClodinary, deleteFromCloudinary, fileDownload };
