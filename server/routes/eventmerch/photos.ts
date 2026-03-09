import { Router } from 'express';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// In-memory storage for demo
const photos = new Map();

// POST /api/eventmerch/photos/upload - Upload photo (mock)
router.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { eventId } = req.body;
    
    // Mock photo data (in production, upload to Cloudinary)
    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const photo = {
      id: photoId,
      eventId,
      cloudinaryPublicId: `mock/${photoId}`,
      url: `https://picsum.photos/seed/${photoId}/800/800`,
      thumbnailUrl: `https://picsum.photos/seed/${photoId}/400/400`,
      uploadedBy: 'Guest',
      width: 800,
      height: 800,
      fileSize: req.file.size,
      isDuplicate: false,
      qualityScore: 85,
      createdAt: new Date().toISOString(),
    };
    
    photos.set(photoId, photo);
    
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
    
    const eventPhotos = Array.from(photos.values())
      .filter(p => p.eventId === eventId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json({ success: true, data: eventPhotos });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch photos' });
  }
});

export default router;
