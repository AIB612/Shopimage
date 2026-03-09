import { Router } from 'express';
import { db } from '../../db';
import { events } from '../../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// POST /api/eventmerch/events - Create new event
router.post('/', async (req, res) => {
  try {
    const eventData = req.body;
    
    const [event] = await db.insert(events).values({
      userId: 'temp-user-id', // TODO: Get from auth
      ...eventData,
    }).returning();
    
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
    
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, id));
    
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
