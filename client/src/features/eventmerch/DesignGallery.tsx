import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Design {
  id: string;
  type: string;
  imageUrl: string;
  prompt: string;
  status: string;
}

interface DesignGalleryProps {
  designs: Design[];
  onSelectDesign: (designId: string) => void;
  onRegenerateDesign: (designId: string) => void;
}

const designTypeLabels: Record<string, string> = {
  'welcome-sign': '🪧 Willkommensschild / 欢迎牌',
  'table-card': '🏷️ Tischkarte / 桌卡',
  'menu-card': '📋 Menükarte / 菜单卡',
  'seating-chart': '🗺️ Sitzplan / 座位表',
  't-shirt': '👕 T-Shirt',
  'mug': '☕ Tasse / 杯子',
  'poster': '🖼️ Poster / 海报',
};

export default function DesignGallery({ designs, onSelectDesign, onRegenerateDesign }: DesignGalleryProps) {
  const [selectedDesigns, setSelectedDesigns] = useState<Set<string>>(new Set());

  const toggleSelect = (designId: string) => {
    const newSelected = new Set(selectedDesigns);
    if (newSelected.has(designId)) {
      newSelected.delete(designId);
    } else {
      newSelected.add(designId);
    }
    setSelectedDesigns(newSelected);
    onSelectDesign(designId);
  };

  if (designs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          Noch keine Designs generiert / 还没有生成设计
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Fülle das Formular aus, um zu starten / 填写表单开始
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          🎨 Deine Designs / 你的设计 ({designs.length})
        </h2>
        <Badge variant="secondary">
          {selectedDesigns.size} ausgewählt / 已选择
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {designs.map((design) => (
          <Card
            key={design.id}
            className={`cursor-pointer transition-all ${
              selectedDesigns.has(design.id)
                ? 'ring-2 ring-primary shadow-lg'
                : 'hover:shadow-md'
            }`}
            onClick={() => toggleSelect(design.id)}
          >
            <CardHeader>
              <CardTitle className="text-lg">
                {designTypeLabels[design.type] || design.type}
              </CardTitle>
              <CardDescription className="text-xs line-clamp-2">
                {design.prompt}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                <img
                  src={design.imageUrl}
                  alt={design.type}
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerateDesign(design.id);
                }}
              >
                🔄 Neu generieren
              </Button>
              <Button
                variant={selectedDesigns.has(design.id) ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
              >
                {selectedDesigns.has(design.id) ? '✓ Ausgewählt' : 'Auswählen'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {selectedDesigns.size > 0 && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl p-4 border">
          <p className="text-sm font-medium mb-2">
            {selectedDesigns.size} Design(s) ausgewählt
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              📥 Herunterladen
            </Button>
            <Button size="sm">
              🛍️ Zu Produkten →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
