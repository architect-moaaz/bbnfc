import React from 'react';
import { Box, Typography } from '@mui/material';
import { Room as RoomIcon } from '@mui/icons-material';

interface LocationMapProps {
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  locationLabel?: string;
}

const LocationMap: React.FC<LocationMapProps> = ({ address, locationLabel }) => {
  if (!address || !address.city) {
    return null;
  }

  // Format the address for display
  const formattedLocation = locationLabel || `${address.city}${address.state ? ', ' + address.state : ''}`;

  // Create address string for Google Maps Static API
  const fullAddress = [
    address.street,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');

  // Use coordinates if available, otherwise use address
  const mapCenter = address.latitude && address.longitude
    ? `${address.latitude},${address.longitude}`
    : encodeURIComponent(fullAddress);

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
  const hasValidApiKey = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY';

  // Generate Google Maps Static API URL
  const mapUrl = hasValidApiKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${mapCenter}&zoom=15&size=600x300&scale=2&maptype=roadmap&markers=color:0x2D6EF5%7C${mapCenter}&key=${apiKey}&style=feature:poi|visibility:off&style=feature:road|element:geometry|color:0xf5f5f5&style=feature:water|element:geometry|color:0xc9e8f7`
    : null;

  return (
    <Box
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        height: '180px',
        backgroundColor: '#E5E7EB',
      }}
    >
      {/* Map Image */}
      {mapUrl ? (
        <Box
          component="img"
          src={mapUrl}
          alt={`Map of ${formattedLocation}`}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={(e) => {
            // Fallback to gradient on error
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        // Fallback gradient with SVG map placeholder
        <Box
          sx={{
            width: '100%',
            height: '100%',
            backgroundImage: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
            opacity: 0.8,
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjYzlkZGY3IiBzdHJva2Utd2lkdGg9IjAuNSIvPgogICAgPC9wYXR0ZXJuPgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTBmMGZmIi8+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPgogIDxjaXJjbGUgY3g9IjMwMCIgY3k9IjEwMCIgcj0iMzAiIGZpbGw9IiMyRDZFRjUiIG9wYWNpdHk9IjAuMyIvPgogIDxjaXJjbGUgY3g9IjMwMCIgY3k9IjEwMCIgcj0iMTUiIGZpbGw9IiMyRDZFRjUiIG9wYWNpdHk9IjAuNiIvPgogIDxjaXJjbGUgY3g9IjMwMCIgY3k9IjEwMCIgcj0iNSIgZmlsbD0iIzJENkVGNSIvPgo8L3N2Zz4=)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </Box>
      )}

      {/* Location Label Overlay */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
          padding: '20px 16px 16px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RoomIcon sx={{ fontSize: 20, color: '#2D6EF5' }} />
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#FFFFFF',
                opacity: 0.9,
              }}
            >
              Office Location
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#FFFFFF',
              }}
            >
              {formattedLocation}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LocationMap;
