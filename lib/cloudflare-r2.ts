
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// Cloudflare R2 configuration from environment variables
const R2_CONFIG = {
  region: "auto",
  endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.NEXT_PUBLIC_R2_SECRET_KEY_ID ?? "",
  },
}

const BUCKET_NAME = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || "dianova-images"
const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL

// Initialize S3 client for R2
const r2Client = new S3Client(R2_CONFIG)

export interface UploadResult {
  key: string
  url: string
  publicUrl: string
}

// Convert data URL to buffer
function dataURLtoBuffer(dataURL: string): { buffer: Buffer; mimeType: string } {
  const arr = dataURL.split(",")
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg"
  const buffer = Buffer.from(arr[1], "base64")
  return { buffer, mimeType }
}

// Generate unique filename
function generateFileName(userId: string, extension = "jpg"): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `scans/${userId}/${timestamp}-${random}.${extension}`
}

// Upload image to Cloudflare R2
export async function uploadImage(dataURL: string, userId: string): Promise<UploadResult> {
  try {
    const { buffer, mimeType } = dataURLtoBuffer(dataURL)
    const extension = mimeType.split("/")[1] || "jpg"
    const key = generateFileName(userId, extension)

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ContentLength: buffer.length,
    })

    await r2Client.send(command)

    const publicUrl = `${PUBLIC_URL}/${key}`

    return {
      key,
      url: publicUrl,
      publicUrl,
    }
  } catch (error) {
    console.error("Error uploading to R2:", error)
    throw new Error("Failed to upload image")
  }
}

// Get signed URL for private access (if needed)
export async function getSignedImageUrl(key: string, expiresIn = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn })
    return signedUrl
  } catch (error) {
    console.error("Error getting signed URL:", error)
    throw new Error("Failed to get signed URL")
  }
}

// Delete image from R2
export async function deleteImage(key: string): Promise<void> {
  try {
    console.log(`Attempting to delete image with key: ${key}`)
    
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const response = await r2Client.send(command)
    console.log(`Successfully deleted image with key: ${key}`, response)
  } catch (error) {
    console.error(`Error deleting image with key ${key} from R2:`, error)
    throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Get public URL for an image
export function getPublicImageUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`
}
