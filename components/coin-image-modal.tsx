import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface CoinImageModalProps {
  onCoinCreated: () => void;
}

const CoinImageModal: React.FC<CoinImageModalProps> = ({ onCoinCreated }) => {
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError('Please select an image file.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implement upload and coin creation logic
      // await uploadImageAndCreateCoin(image);
      onCoinCreated();
    } catch (err) {
      setError('Failed to create coin from image.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto my-4">
      <CardHeader>
        <CardTitle>Create Coin from Image</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input type="file" accept="image/*" onChange={handleFileChange} />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : 'Create Coin'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CoinImageModal;
