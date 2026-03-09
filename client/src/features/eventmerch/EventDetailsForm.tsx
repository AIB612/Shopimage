import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EventDetails {
  type: string;
  name1: string;
  name2?: string;
  date: string;
  location: string;
  guestCount: number;
  style: string;
  colors: string[];
}

interface EventDetailsFormProps {
  onSubmit: (details: EventDetails) => void;
  isLoading?: boolean;
}

export default function EventDetailsForm({ onSubmit, isLoading }: EventDetailsFormProps) {
  const [formData, setFormData] = useState<EventDetails>({
    type: 'wedding',
    name1: '',
    name2: '',
    date: '',
    location: '',
    guestCount: 80,
    style: 'modern-alpine',
    colors: ['#8B9D83', '#F5F5DC', '#FFD700'], // Sage Green, Cream, Gold
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🏔️ Event-Details</CardTitle>
        <CardDescription>
          Erzähl uns von deiner Hochzeit / 告诉我们你的婚礼
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Event-Typ / 活动类型</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wedding">💍 Hochzeit / 婚礼</SelectItem>
                <SelectItem value="birthday">🎂 Geburtstag / 生日</SelectItem>
                <SelectItem value="baby-shower">👶 Baby Shower</SelectItem>
                <SelectItem value="corporate">🏢 Firmenfeier / 公司活动</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name1">Name 1 / 名字1 *</Label>
              <Input
                id="name1"
                value={formData.name1}
                onChange={(e) => setFormData({ ...formData, name1: e.target.value })}
                placeholder="Anna"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name2">Name 2 / 名字2</Label>
              <Input
                id="name2"
                value={formData.name2}
                onChange={(e) => setFormData({ ...formData, name2: e.target.value })}
                placeholder="Tom"
              />
            </div>
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Datum / 日期 *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location / 地点 *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Grindelwald, Berner Oberland"
                required
              />
            </div>
          </div>

          {/* Guest Count */}
          <div className="space-y-2">
            <Label htmlFor="guestCount">Anzahl Gäste / 客人数量 *</Label>
            <Input
              id="guestCount"
              type="number"
              value={formData.guestCount}
              onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value) })}
              min="1"
              required
            />
          </div>

          {/* Style */}
          <div className="space-y-2">
            <Label htmlFor="style">Stil / 风格 *</Label>
            <Select
              value={formData.style}
              onValueChange={(value) => setFormData({ ...formData, style: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern-alpine">🏔️ Modern Alpine</SelectItem>
                <SelectItem value="boho-mountain">🌿 Boho Mountain</SelectItem>
                <SelectItem value="rustic-chic">🪵 Rustic Chic</SelectItem>
                <SelectItem value="minimalist">⚪ Minimalist</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Colors */}
          <div className="space-y-2">
            <Label>Farben / 颜色</Label>
            <div className="flex gap-2">
              {formData.colors.map((color, index) => (
                <div
                  key={index}
                  className="w-12 h-12 rounded-md border-2 border-gray-300"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Sage Green, Cream, Gold
            </p>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? '⏳ Generiere Designs...' : '✨ Designs generieren'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
