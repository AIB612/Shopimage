import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  uploadedBy?: string;
  isDuplicate: boolean;
  qualityScore?: number;
  createdAt: string;
}

interface PhotoGalleryProps {
  eventId: string;
  autoRefresh?: boolean;
}

export default function PhotoGallery({ eventId, autoRefresh = false }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'best' | 'duplicates'>('all');
  const [stats, setStats] = useState({
    total: 0,
    duplicates: 0,
    highQuality: 0,
  });

  // Fetch photos
  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/eventmerch/photos/${eventId}`);
      const result = await response.json();
      
      if (result.success) {
        const photosData = result.data;
        setPhotos(photosData);
        
        // Calculate stats
        const duplicates = photosData.filter((p: Photo) => p.isDuplicate).length;
        const highQuality = photosData.filter((p: Photo) => (p.qualityScore || 0) >= 80).length;
        
        setStats({
          total: photosData.length,
          duplicates,
          highQuality,
        });
        
        applyFilter(photosData, filter);
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filter
  const applyFilter = (photosData: Photo[], filterType: typeof filter) => {
    let filtered = photosData;
    
    switch (filterType) {
      case 'best':
        filtered = photosData.filter(p => !p.isDuplicate && (p.qualityScore || 0) >= 70);
        break;
      case 'duplicates':
        filtered = photosData.filter(p => p.isDuplicate);
        break;
      default:
        filtered = photosData;
    }
    
    setFilteredPhotos(filtered);
  };

  useEffect(() => {
    fetchPhotos();
    
    if (autoRefresh) {
      const interval = setInterval(fetchPhotos, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [eventId, autoRefresh]);

  useEffect(() => {
    applyFilter(photos, filter);
  }, [filter, photos]);

  const handleDownloadAll = () => {
    // TODO: Implement bulk download
    alert('Download wird vorbereitet... / 准备下载...');
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lade Fotos... / 加载照片...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gesamt / 总计</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hohe Qualität / 高质量</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.highQuality}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Duplikate / 重复</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats.duplicates}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter & Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Alle ({stats.total})
          </Button>
          <Button
            variant={filter === 'best' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('best')}
          >
            ⭐ Beste ({stats.highQuality})
          </Button>
          <Button
            variant={filter === 'duplicates' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('duplicates')}
          >
            🔄 Duplikate ({stats.duplicates})
          </Button>
        </div>
        
        <Button onClick={handleDownloadAll}>
          📥 Alle herunterladen
        </Button>
      </div>

      {/* Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            Keine Fotos gefunden / 未找到照片
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-pointer"
            >
              <img
                src={photo.thumbnailUrl}
                alt="Event photo"
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  🔍 Ansehen
                </Button>
              </div>

              {/* Badges */}
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                {photo.isDuplicate && (
                  <Badge variant="destructive" className="text-xs">
                    Duplikat
                  </Badge>
                )}
                {photo.qualityScore && photo.qualityScore >= 80 && (
                  <Badge variant="default" className="text-xs bg-green-600">
                    ⭐ {photo.qualityScore}
                  </Badge>
                )}
              </div>

              {/* Uploader */}
              {photo.uploadedBy && (
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="text-xs">
                    {photo.uploadedBy}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
