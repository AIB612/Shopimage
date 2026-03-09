import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import QRCode from 'qrcode';

interface PhotoUploaderProps {
  eventId: string;
  onUploadComplete: (photos: any[]) => void;
}

export default function PhotoUploader({ eventId, onUploadComplete }: PhotoUploaderProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Generate QR Code
  const generateQRCode = useCallback(async () => {
    const uploadUrl = `${window.location.origin}/upload/${eventId}`;
    const qrDataUrl = await QRCode.toDataURL(uploadUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    setQrCodeUrl(qrDataUrl);
  }, [eventId]);

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);
    const totalFiles = files.length;
    let uploaded = 0;

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('eventId', eventId);

        const response = await fetch('/api/eventmerch/photos/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          setUploadedPhotos((prev) => [...prev, result.data]);
        }

        uploaded++;
        setUploadProgress((uploaded / totalFiles) * 100);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    onUploadComplete(uploadedPhotos);
  };

  return (
    <div className="space-y-6">
      {/* QR Code Section */}
      <Card>
        <CardHeader>
          <CardTitle>📸 QR-Code für Gäste / 客人二维码</CardTitle>
          <CardDescription>
            Gäste scannen den Code und laden Fotos hoch / 客人扫描代码并上传照片
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!qrCodeUrl ? (
            <Button onClick={generateQRCode} className="w-full">
              🎯 QR-Code generieren
            </Button>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">
                  {window.location.origin}/upload/{eventId}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    📥 QR-Code herunterladen
                  </Button>
                  <Button variant="outline" size="sm">
                    🖨️ Drucken
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>📤 Fotos hochladen / 上传照片</CardTitle>
          <CardDescription>
            Oder lade Fotos direkt hoch / 或直接上传照片
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              id="photo-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <div className="text-4xl">📸</div>
              <p className="text-sm font-medium">
                Klicke oder ziehe Fotos hierher / 点击或拖拽照片到这里
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, HEIC bis 10MB / 最大10MB
              </p>
            </label>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Hochladen... / 上传中...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {uploadedPhotos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                ✅ {uploadedPhotos.length} Fotos hochgeladen / 已上传
              </p>
              <div className="grid grid-cols-4 gap-2">
                {uploadedPhotos.slice(0, 8).map((photo, index) => (
                  <div key={index} className="aspect-square bg-gray-100 rounded overflow-hidden">
                    <img
                      src={photo.thumbnailUrl}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
