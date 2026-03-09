import { Router } from 'express';
import { db } from '../../db';
import { photos } from '../../db/schema';
import { eq } from 'drizzle-orm';
import multer from 'multer';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/eventmerch/photos/upload - Upload photo
router.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { eventId } = req.body;
    const buffer = req.file.buffer;

    // Optimize image
    const optimized = await sharp(buffer)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Create thumbnail
    const thumbnail = await sharp(buffer)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Get metadata
    const metadata = await sharp(buffer).metadata();

    // Upload to Cloudinary
    const uploadPromise = (buf: Buffer, folder: string) =>
      new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: `eventmerch/${eventId}/${folder}` },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buf);
      });

    const [mainResult, thumbResult] = await Promise.all([
      uploadPromise(optimized, 'photos'),
      uploadPromise(thumbnail, 'thumbnails'),
    ]);

    // Save to database
    const [photo] = await db.insert(photos).values({
      eventId,
      cloudinaryPublicId: mainResult.public_id,
      url: mainResult.secure_url,
      thumbnailUrl: thumbResult.secure_url,
      width: metadata.width || 0,
      height: metadata.height || 0,
      fileSize: buffer.length,
      isDuplicate: false, // TODO: Implement duplicate detection
      qualityScore: 85, // TODO: Implement quality scoring
    }).returning();

    res.json({ success: true, data: photo });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload photo' });
  }
});

// GET /api/eventmerch/photos/:eventId - Get all photos for an event
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const eventPhotos = await db
      .select()
      .from(photos)
      .where(eq(photos.eventId, eventId))
      .orderBy(photos.createdAt);

    res.json({ success: true, data: eventPhotos });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch photos' });
  }
});

export default router;
