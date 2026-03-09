import { Router } from 'express';

const router = Router();

// In-memory storage for demo
const designs = new Map();

// Mock AI design generation (replace with real OpenAI later)
async function generateMockDesign(prompt: string): Promise<string> {
  // Return placeholder image URL
  const randomId = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/${randomId}/1024/1024`;
}

// POST /api/eventmerch/designs/generate - Generate design with AI
router.post('/generate', async (req, res) => {
  try {
    const { eventId, type, prompt } = req.body;
    
    // Generate mock design
    const imageUrl = await generateMockDesign(prompt);
    
    const designId = `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const design = {
      id: designId,
      eventId,
      type,
      prompt,
      imageUrl,
      aiModel: 'mock-ai',
      status: 'generated',
      createdAt: new Date().toISOString(),
    };
    
    designs.set(designId, design);
    
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
    
    const eventDesigns = Array.from(designs.values())
      .filter(d => d.eventId === eventId);
    
    res.json({ success: true, data: eventDesigns });
  } catch (error) {
    console.error('Get designs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch designs' });
  }
});

export default router;
