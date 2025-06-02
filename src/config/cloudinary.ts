import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import ENV from "./env";

cloudinary.config({
  cloud_name: ENV.cloud_name,
  api_key: ENV.cloud_api_key,
  api_secret: ENV.cloud_api_secret,
});

export default cloudinary;

// Single file upload function
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string
): Promise<{ public_id: string; secure_url: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          return reject(
            new Error("Failed to upload image to Cloudinary: " + error.message)
          );
        }
        if (!result?.secure_url || !result.public_id) {
          return reject(
            new Error(
              "Failed to retrieve public_id or URL from Cloudinary response"
            )
          );
        }
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
        });
      }
    );

    const stream = Readable.from(fileBuffer);
    stream.pipe(uploadStream);
  });
};

// Multi-file upload function
export const uploadMultipleToCloudinary = async (
  fileBuffers: Buffer[],
  folder: string
): Promise<{ public_id: string; secure_url: string }[]> => {
  return Promise.all(fileBuffers.map((buffer) => uploadToCloudinary(buffer, folder)));
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error(`Failed to delete image with public_id ${publicId} from Cloudinary`);
  }
};