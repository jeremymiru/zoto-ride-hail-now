import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, ExternalLink } from 'lucide-react';

interface GoogleMapsSetupProps {
  onApiKeySet: (apiKey: string) => void;
}

const GoogleMapsSetup: React.FC<GoogleMapsSetupProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    // Basic validation - Google Maps API keys typically start with 'AIza'
    setIsValid(value.trim().length > 30 && value.startsWith('AIza'));
  };

  const handleSubmit = () => {
    if (isValid) {
      localStorage.setItem('google_maps_api_key', apiKey);
      onApiKeySet(apiKey);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="gradient-primary p-3 rounded-full">
              <MapPin className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Google Maps Setup</CardTitle>
          <CardDescription>
            To enable real-time tracking like Uber, please enter your Google Maps API key
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              You need a Google Maps API key with the following APIs enabled:
              <ul className="mt-2 list-disc list-inside text-sm">
                <li>Maps JavaScript API</li>
                <li>Geocoding API</li>
                <li>Directions API</li>
                <li>Places API</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="apiKey">Google Maps API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="font-mono"
            />
            {apiKey && !isValid && (
              <p className="text-sm text-destructive">
                Please enter a valid Google Maps API key
              </p>
            )}
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={!isValid}
            className="w-full"
          >
            Set API Key
          </Button>

          <div className="text-center">
            <Button 
              variant="link" 
              size="sm"
              onClick={() => window.open('https://developers.google.com/maps/gmp-get-started', '_blank')}
              className="text-muted-foreground"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Get Google Maps API Key
            </Button>
          </div>

          <div className="text-center">
            <Button 
              variant="link" 
              size="sm"
              onClick={() => window.open('https://console.cloud.google.com/apis/library', '_blank')}
              className="text-muted-foreground"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Enable Required APIs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleMapsSetup;