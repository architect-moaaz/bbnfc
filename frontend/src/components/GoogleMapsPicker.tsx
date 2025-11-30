import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Box, Typography, CircularProgress } from '@mui/material';
import { MyLocation as MyLocationIcon } from '@mui/icons-material';

interface GoogleMapsPickerProps {
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  onLocationChange?: (location: { latitude: number; longitude: number }) => void;
  editable?: boolean;
}

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '12px',
};

const GoogleMapsPicker: React.FC<GoogleMapsPickerProps> = ({
  address,
  onLocationChange,
  editable = false,
}) => {
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: 40.7128, lng: -74.0060 }); // Default: New York
  const [isGeocoding, setIsGeocoding] = useState(false);

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
  const hasValidApiKey = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: hasValidApiKey ? apiKey : 'AIzaSyDummyKeyForFallback',
  });

  // Geocode address to get coordinates
  const geocodeAddress = useCallback(async () => {
    if (!address || !window.google) return;

    const fullAddress = [
      address.street,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ]
      .filter(Boolean)
      .join(', ');

    if (!fullAddress) return;

    setIsGeocoding(true);
    const geocoder = new window.google.maps.Geocoder();

    try {
      const result = await geocoder.geocode({ address: fullAddress });
      if (result.results[0]) {
        const location = {
          lat: result.results[0].geometry.location.lat(),
          lng: result.results[0].geometry.location.lng(),
        };
        setMarkerPosition(location);
        setMapCenter(location);

        if (onLocationChange) {
          onLocationChange({ latitude: location.lat, longitude: location.lng });
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocoding(false);
    }
  }, [address, onLocationChange]);

  // Load saved coordinates or geocode address
  useEffect(() => {
    if (address?.latitude && address?.longitude) {
      const location = { lat: address.latitude, lng: address.longitude };
      setMarkerPosition(location);
      setMapCenter(location);
    } else {
      geocodeAddress();
    }
  }, [address, geocodeAddress]);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!editable || !e.latLng) return;

      const location = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setMarkerPosition(location);

      if (onLocationChange) {
        onLocationChange({ latitude: location.lat, longitude: location.lng });
      }
    },
    [editable, onLocationChange]
  );

  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      const location = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setMarkerPosition(location);

      if (onLocationChange) {
        onLocationChange({ latitude: location.lat, longitude: location.lng });
      }
    },
    [onLocationChange]
  );

  if (loadError) {
    return (
      <Box
        sx={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F3F4F6',
          borderRadius: '12px',
        }}
      >
        <Typography color="error">Error loading maps</Typography>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box
        sx={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F3F4F6',
          borderRadius: '12px',
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!hasValidApiKey) {
    return (
      <Box
        sx={{
          ...containerStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F3F4F6',
          borderRadius: '12px',
          p: 3,
          textAlign: 'center',
        }}
      >
        <MyLocationIcon sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Google Maps API Key Required
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {isGeocoding && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1,
            backgroundColor: 'white',
            px: 2,
            py: 1,
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={12} />
            Finding location...
          </Typography>
        </Box>
      )}

      {editable && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1,
            backgroundColor: 'white',
            px: 2,
            py: 1,
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Click or drag pin to adjust location
          </Typography>
        </Box>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={15}
        onClick={handleMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {markerPosition && (
          <Marker
            position={markerPosition}
            draggable={editable}
            onDragEnd={handleMarkerDragEnd}
            animation={window.google?.maps?.Animation?.DROP}
          />
        )}
      </GoogleMap>
    </Box>
  );
};

export default GoogleMapsPicker;
