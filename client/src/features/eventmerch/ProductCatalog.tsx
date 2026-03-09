import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  variants: ProductVariant[];
  category: string;
}

interface ProductVariant {
  id: string;
  name: string;
  size?: string;
  color?: string;
  price: number;
}

interface ProductCatalogProps {
  designId: string;
  onAddToCart: (productId: string, variantId: string, quantity: number) => void;
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Willkommensschild (Holz)',
    description: 'A1 Holzschild mit deinem Design',
    price: 8900, // CHF 89.00
    imageUrl: '/placeholder-welcome-sign.jpg',
    category: 'decoration',
    variants: [
      { id: 'v1', name: 'A1 Holz', price: 8900 },
      { id: 'v2', name: 'A2 Holz', price: 6900 },
      { id: 'v3', name: 'A1 Acryl', price: 7900 },
    ],
  },
  {
    id: '2',
    name: 'Tischkarten (20 Stück)',
    description: 'Personalisierte Tischkarten',
    price: 4500,
    imageUrl: '/placeholder-table-cards.jpg',
    category: 'decoration',
    variants: [
      { id: 'v1', name: '20 Stück', price: 4500 },
      { id: 'v2', name: '50 Stück', price: 9900 },
    ],
  },
  {
    id: '3',
    name: 'T-Shirt "Team Braut"',
    description: 'Personalisiertes T-Shirt',
    price: 2400,
    imageUrl: '/placeholder-tshirt.jpg',
    category: 'apparel',
    variants: [
      { id: 'v1', name: 'S', size: 'S', price: 2400 },
      { id: 'v2', name: 'M', size: 'M', price: 2400 },
      { id: 'v3', name: 'L', size: 'L', price: 2400 },
      { id: 'v4', name: 'XL', size: 'XL', price: 2600 },
    ],
  },
  {
    id: '4',
    name: 'Tasse (Gäste-Geschenk)',
    description: 'Keramiktasse mit Design',
    price: 1200,
    imageUrl: '/placeholder-mug.jpg',
    category: 'gifts',
    variants: [
      { id: 'v1', name: 'Standard', price: 1200 },
      { id: 'v2', name: 'Groß (400ml)', price: 1500 },
    ],
  },
  {
    id: '5',
    name: 'Poster A2',
    description: 'Hochwertiger Druck',
    price: 2900,
    imageUrl: '/placeholder-poster.jpg',
    category: 'decoration',
    variants: [
      { id: 'v1', name: 'A2', price: 2900 },
      { id: 'v2', name: 'A1', price: 3900 },
    ],
  },
  {
    id: '6',
    name: 'Aufkleber (50 Stück)',
    description: 'Runde Aufkleber 5cm',
    price: 1500,
    imageUrl: '/placeholder-stickers.jpg',
    category: 'gifts',
    variants: [
      { id: 'v1', name: '50 Stück', price: 1500 },
      { id: 'v2', name: '100 Stück', price: 2500 },
    ],
  },
];

export default function ProductCatalog({ designId, onAddToCart }: ProductCatalogProps) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>('all');

  const formatPrice = (cents: number) => {
    return `CHF ${(cents / 100).toFixed(2)}`;
  };

  const filteredProducts = filter === 'all' 
    ? mockProducts 
    : mockProducts.filter(p => p.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          🛍️ Produkt-Katalog / 产品目录
        </h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Produkte / 所有产品</SelectItem>
            <SelectItem value="decoration">🪧 Dekoration / 装饰</SelectItem>
            <SelectItem value="apparel">👕 Kleidung / 服装</SelectItem>
            <SelectItem value="gifts">🎁 Geschenke / 礼物</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-4xl">🖼️</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(product.price)}
                  </span>
                  <Badge variant="secondary">
                    {product.variants.length} Varianten
                  </Badge>
                </div>

                {product.variants.length > 1 && (
                  <Select
                    value={selectedVariants[product.id] || product.variants[0].id}
                    onValueChange={(value) =>
                      setSelectedVariants({ ...selectedVariants, [product.id]: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {product.variants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.name} - {formatPrice(variant.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => {
                  const variantId = selectedVariants[product.id] || product.variants[0].id;
                  onAddToCart(product.id, variantId, 1);
                }}
              >
                🛒 In den Warenkorb
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
