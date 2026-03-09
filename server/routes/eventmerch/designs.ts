import { Router } from 'express';
import { db } from '../../db';
import { designs } from '../../db/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/eventmerch/designs/generate - Generate design with AI
router.post('/generate', async (req, res) => {
  try {
    const { eventId, type, prompt } = req.body;
    
    // Generate design with OpenAI DALL-E
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Create a beautiful, elegant ${type} design: ${prompt}. 
               Style: Modern Alpine, Swiss Mountain Wedding. 
               Colors: Sage Green, Cream, Gold. 
               High quality, professional, printable.`,
      size: '1024x1024',
      quality: 'hd',
      n: 1,
    });
    
    const imageUrl = response.data[0].url!;
    
    // Save to database
    const [design] = await db.insert(designs).values({
      eventId,
      type,
      prompt,
      imageUrl,
      aiModel: 'dall-e-3',
      status: 'generated',
    }).returning();
    
    res.json({ success: true, data: design });
  } catch (error) {
    console.error('Design generation error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate design' });
  }
});

// GET /api/eventmerch/designs/:eventId - Get all designs for an event
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const eventDesigns = await db
      .select()
      .from(designs)
      .where(eq(designs.eventId, eventId));
    
    res.json({ success: true, data: eventDesigns });
  } catch (error) {
    console.error('Get designs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch designs' });
  }
});

export default router;
