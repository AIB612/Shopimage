import { Router } from 'express';

const router = Router();

// In-memory storage for demo (replace with real DB later)
const events = new Map();

// POST /api/eventmerch/events - Create new event
router.post('/', async (req, res) => {
  try {
    const eventData = req.body;
    const eventId = `evt_${Date.now()}`;
    
    const event = {
      id: eventId,
      userId: 'demo-user',
      ...eventData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    events.set(eventId, event);
    
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, error: 'Failed to create event' });
  }
});

// GET /api/eventmerch/events/:id - Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const event = events.get(id);
    
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch event' });
  }
});

export default router;
