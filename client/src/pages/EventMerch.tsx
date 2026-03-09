import { useState } from 'react';
import EventDetailsForm from '@/features/eventmerch/EventDetailsForm';
import DesignGallery from '@/features/eventmerch/DesignGallery';
import ProductCatalog from '@/features/eventmerch/ProductCatalog';
import PhotoUploader from '@/features/eventmerch/PhotoUploader';
import PhotoGallery from '@/features/eventmerch/PhotoGallery';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EventMerchPage() {
  const [currentStep, setCurrentStep] = useState<'details' | 'designs' | 'products' | 'photos'>('details');
  const [eventId, setEventId] = useState<string>('');
  const [designs, setDesigns] = useState<any[]>([]);
  const [selectedDesigns, setSelectedDesigns] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cart, setCart] = useState<any[]>([]);

  // Handle event creation & design generation
  const handleEventSubmit = async (eventDetails: any) => {
    setIsGenerating(true);
    
    try {
      // 1. Create event
      const eventResponse = await fetch('/api/eventmerch/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventDetails),
      });
      const eventResult = await eventResponse.json();
      
      if (eventResult.success) {
        const newEventId = eventResult.data.id;
        setEventId(newEventId);
        
        // 2. Generate designs
        const designTypes = ['welcome-sign', 'table-card', 'menu-card', 'poster'];
        const designPromises = designTypes.map(type =>
          fetch('/api/eventmerch/designs/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: newEventId,
              type,
              prompt: `${eventDetails.name1} ${eventDetails.name2 || ''} ${eventDetails.style} wedding in ${eventDetails.location}`,
            }),
          }).then(res => res.json())
        );
        
        const designResults = await Promise.all(designPromises);
        const newDesigns = designResults
          .filter(r => r.success)
          .map(r => r.data);
        
        setDesigns(newDesigns);
        setCurrentStep('designs');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Fehler beim Generieren / 生成错误');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle design selection
  const handleSelectDesign = (designId: string) => {
    setSelectedDesigns(prev =>
      prev.includes(designId)
        ? prev.filter(id => id !== designId)
        : [...prev, designId]
    );
  };

  // Handle design regeneration
  const handleRegenerateDesign = async (designId: string) => {
    // TODO: Implement regeneration
    alert('Design wird neu generiert... / 重新生成设计...');
  };

  // Handle add to cart
  const handleAddToCart = (productId: string, variantId: string, quantity: number) => {
    setCart(prev => [...prev, { productId, variantId, quantity }]);
    alert('✅ Zum Warenkorb hinzugefügt / 已添加到购物车');
  };

  // Handle photo upload complete
  const handlePhotoUploadComplete = (photos: any[]) => {
    alert(`✅ ${photos.length} Fotos hochgeladen / 已上传`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">
            🏔️ EventMerch
          </h1>
          <p className="text-gray-600">
            AI-gesteuerte Event-Personalisierung / AI驱动的活动个性化
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {[
              { key: 'details', label: '1. Details', icon: '📝' },
              { key: 'designs', label: '2. Designs', icon: '🎨' },
              { key: 'products', label: '3. Produkte', icon: '🛍️' },
              { key: 'photos', label: '4. Fotos', icon: '📸' },
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                    currentStep === step.key
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <span>{step.icon}</span>
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                {index < 3 && (
                  <div className="w-8 h-0.5 bg-gray-300 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          {currentStep === 'details' && (
            <EventDetailsForm
              onSubmit={handleEventSubmit}
              isLoading={isGenerating}
            />
          )}

          {currentStep === 'designs' && (
            <div className="space-y-6">
              <DesignGallery
                designs={designs}
                onSelectDesign={handleSelectDesign}
                onRegenerateDesign={handleRegenerateDesign}
              />
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('details')}
                >
                  ← Zurück
                </Button>
                <Button
                  onClick={() => setCurrentStep('products')}
                  disabled={selectedDesigns.length === 0}
                >
                  Weiter zu Produkten →
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'products' && (
            <div className="space-y-6">
              <ProductCatalog
                designId={selectedDesigns[0] || ''}
                onAddToCart={handleAddToCart}
              />
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('designs')}
                >
                  ← Zurück
                </Button>
                <Button onClick={() => setCurrentStep('photos')}>
                  Weiter zu Fotos →
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'photos' && eventId && (
            <div className="space-y-6">
              <Tabs defaultValue="upload">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">📤 Upload</TabsTrigger>
                  <TabsTrigger value="gallery">🖼️ Galerie</TabsTrigger>
                </TabsList>
                <TabsContent value="upload">
                  <PhotoUploader
                    eventId={eventId}
                    onUploadComplete={handlePhotoUploadComplete}
                  />
                </TabsContent>
                <TabsContent value="gallery">
                  <PhotoGallery eventId={eventId} autoRefresh={true} />
                </TabsContent>
              </Tabs>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('products')}
                >
                  ← Zurück
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Cart Badge */}
        {cart.length > 0 && (
          <div className="fixed bottom-6 right-6">
            <Button size="lg" className="rounded-full shadow-lg">
              🛒 Warenkorb ({cart.length})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
