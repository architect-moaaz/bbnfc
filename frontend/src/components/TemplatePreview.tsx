import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  LinkedIn as LinkedInIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Template } from '../types';

interface TemplatePreviewProps {
  template: Template;
  width?: number;
  height?: number;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ 
  template, 
  width = 350, 
  height = 500 
}) => {
  const mockData = {
    name: 'Sarah Johnson',
    title: 'Senior Marketing Manager',
    company: 'TechCorp Inc.',
    bio: 'Passionate marketing professional with 8+ years of experience in digital strategy and brand development.',
    phone: '+1 (555) 123-4567',
    email: 'sarah.johnson@techcorp.com',
    website: 'www.sarahjohnson.com',
    location: 'San Francisco, CA',
    businessHours: [
      { day: 'Monday', hours: '9:00 AM - 6:00 PM' },
      { day: 'Tuesday', hours: '9:00 AM - 6:00 PM' },
      { day: 'Wednesday', hours: '9:00 AM - 6:00 PM' },
      { day: 'Thursday', hours: '9:00 AM - 6:00 PM' },
      { day: 'Friday', hours: '9:00 AM - 5:00 PM' },
    ]
  };

  const getLayoutComponent = () => {
    switch (template.category) {
      case 'corporate':
        return <CorporateLayout template={template} data={mockData} />;
      case 'creative':
        return <CreativeLayout template={template} data={mockData} />;
      case 'healthcare':
        return <HealthcareLayout template={template} data={mockData} />;
      case 'education':
        return <EducationLayout template={template} data={mockData} />;
      case 'technology':
        return <TechnologyLayout template={template} data={mockData} />;
      case 'hospitality':
        return <HospitalityLayout template={template} data={mockData} />;
      case 'retail':
        return <RetailLayout template={template} data={mockData} />;
      default:
        return <DefaultLayout template={template} data={mockData} />;
    }
  };

  return (
    <Box
      sx={{
        width,
        height,
        backgroundColor: template.defaultColors?.background || '#ffffff',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        position: 'relative',
        fontFamily: template.defaultFonts?.body || 'Inter',
      }}
    >
      {getLayoutComponent()}
    </Box>
  );
};

// Corporate Layout
const CorporateLayout: React.FC<{ template: Template; data: any }> = ({ template, data }) => (
  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    {/* Header with gradient */}
    <Box
      sx={{
        background: `linear-gradient(135deg, ${template.defaultColors?.primary}, ${template.defaultColors?.secondary})`,
        p: 3,
        textAlign: 'center',
        color: 'white',
      }}
    >
      <Avatar
        sx={{
          width: 80,
          height: 80,
          mx: 'auto',
          mb: 2,
          bgcolor: 'rgba(255,255,255,0.2)',
          fontSize: '2rem',
          fontWeight: 600,
        }}
      >
        SJ
      </Avatar>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        {data.name}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.9 }}>
        {data.title}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.875rem' }}>
        {data.company}
      </Typography>
    </Box>

    {/* Content */}
    <Box sx={{ p: 2.5, flexGrow: 1, fontSize: '0.85rem' }}>
      <Typography variant="body2" sx={{ mb: 2.5, lineHeight: 1.4, color: '#666' }}>
        {data.bio}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneIcon sx={{ fontSize: 16, color: template.defaultColors?.primary }} />
          <Typography variant="body2">{data.phone}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon sx={{ fontSize: 16, color: template.defaultColors?.primary }} />
          <Typography variant="body2">{data.email}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WebsiteIcon sx={{ fontSize: 16, color: template.defaultColors?.primary }} />
          <Typography variant="body2">{data.website}</Typography>
        </Box>
      </Box>

      {template.features?.includes('hours') && (
        <Box sx={{ mt: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ScheduleIcon sx={{ fontSize: 16 }} />
            Business Hours
          </Typography>
          <Box sx={{ fontSize: '0.75rem', color: '#666' }}>
            <Typography variant="body2">Mon-Thu: 9:00 AM - 6:00 PM</Typography>
            <Typography variant="body2">Friday: 9:00 AM - 5:00 PM</Typography>
          </Box>
        </Box>
      )}
    </Box>
  </Box>
);

// Creative Layout
const CreativeLayout: React.FC<{ template: Template; data: any }> = ({ template, data }) => (
  <Box sx={{ height: '100%', position: 'relative' }}>
    {/* Artistic background */}
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '60%',
        height: '40%',
        background: `linear-gradient(45deg, ${template.defaultColors?.primary}, ${template.defaultColors?.secondary})`,
        borderBottomLeftRadius: '50%',
        opacity: 0.1,
      }}
    />
    
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Avatar
          sx={{
            width: 70,
            height: 70,
            bgcolor: template.defaultColors?.primary,
            fontSize: '1.5rem',
            fontWeight: 600,
          }}
        >
          SJ
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: template.defaultColors?.primary, mb: 0.5 }}>
            {data.name}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
            {data.title}
          </Typography>
          <Chip 
            label={data.company} 
            size="small" 
            sx={{ 
              bgcolor: template.defaultColors?.secondary,
              color: template.defaultColors?.primary,
              fontWeight: 500
            }} 
          />
        </Box>
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Bio */}
      <Typography variant="body2" sx={{ mb: 3, lineHeight: 1.5, fontStyle: 'italic', color: '#555' }}>
        "{data.bio}"
      </Typography>

      {/* Portfolio/Gallery Section */}
      {template.features?.includes('gallery') && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Recent Work
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[1, 2, 3].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 60,
                  height: 40,
                  bgcolor: template.defaultColors?.secondary,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  color: template.defaultColors?.primary,
                }}
              >
                IMG
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Contact */}
      <Box sx={{ mt: 'auto', fontSize: '0.8rem' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <EmailIcon sx={{ fontSize: 14, color: template.defaultColors?.primary }} />
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{data.email}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LinkedInIcon sx={{ fontSize: 14, color: template.defaultColors?.primary }} />
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>LinkedIn</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  </Box>
);

// Healthcare Layout
const HealthcareLayout: React.FC<{ template: Template; data: any }> = ({ template, data }) => (
  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    {/* Clean header */}
    <Box sx={{ p: 3, borderBottom: `3px solid ${template.defaultColors?.primary}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            width: 60,
            height: 60,
            bgcolor: template.defaultColors?.primary,
            fontSize: '1.25rem',
          }}
        >
          SJ
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: template.defaultColors?.primary }}>
            Dr. {data.name}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            {data.title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
            {data.company}
          </Typography>
        </Box>
      </Box>
    </Box>

    <Box sx={{ p: 3, flexGrow: 1 }}>
      {/* Services */}
      {template.features?.includes('services') && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: template.defaultColors?.primary }}>
            Specializations
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {['Cardiology', 'Internal Medicine', 'Preventive Care'].map((service) => (
              <Chip
                key={service}
                label={service}
                size="small"
                variant="outlined"
                sx={{ 
                  borderColor: template.defaultColors?.primary,
                  color: template.defaultColors?.primary,
                  fontSize: '0.7rem'
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Business Hours */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: template.defaultColors?.primary }}>
          Office Hours
        </Typography>
        <Box sx={{ fontSize: '0.8rem', color: '#666' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Monday - Thursday: 8:00 AM - 6:00 PM</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Friday: 8:00 AM - 4:00 PM</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Emergency: 24/7</Typography>
        </Box>
      </Box>

      {/* Contact */}
      <Box sx={{ mt: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon sx={{ fontSize: 16, color: template.defaultColors?.primary }} />
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{data.phone}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon sx={{ fontSize: 16, color: template.defaultColors?.primary }} />
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{data.email}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  </Box>
);

// Technology Layout
const TechnologyLayout: React.FC<{ template: Template; data: any }> = ({ template, data }) => (
  <Box sx={{ height: '100%', bgcolor: '#fafafa' }}>
    {/* Tech-style header */}
    <Box
      sx={{
        background: `linear-gradient(90deg, ${template.defaultColors?.primary}, #64b5f6)`,
        p: 2.5,
        color: 'white',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            width: 50,
            height: 50,
            bgcolor: 'rgba(255,255,255,0.2)',
            fontSize: '1.1rem',
            border: '2px solid rgba(255,255,255,0.3)',
          }}
        >
          SJ
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
            {data.name}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {data.title}
          </Typography>
        </Box>
      </Box>
    </Box>

    <Box sx={{ p: 2.5 }}>
      {/* Tech Skills */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: template.defaultColors?.primary }}>
          Tech Stack
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {['React', 'Node.js', 'Python', 'AWS', 'Docker'].map((tech) => (
            <Chip
              key={tech}
              label={tech}
              size="small"
              sx={{
                bgcolor: template.defaultColors?.primary,
                color: 'white',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Code-style bio */}
      <Box sx={{ mb: 3, fontFamily: 'monospace', fontSize: '0.8rem', color: '#666' }}>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
          {`// Full-stack developer passionate about`}
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
          {`// building scalable web applications`}
        </Typography>
      </Box>

      {/* Contact */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: '0.85rem' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon sx={{ fontSize: 16, color: template.defaultColors?.primary }} />
          <Typography variant="body2" sx={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            {data.email}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WebsiteIcon sx={{ fontSize: 16, color: template.defaultColors?.primary }} />
          <Typography variant="body2" sx={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            github.com/sarah-dev
          </Typography>
        </Box>
      </Box>
    </Box>
  </Box>
);

// Education Layout
const EducationLayout: React.FC<{ template: Template; data: any }> = ({ template, data }) => (
  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    {/* Academic header */}
    <Box
      sx={{
        background: `linear-gradient(135deg, ${template.defaultColors?.primary}, ${template.defaultColors?.secondary})`,
        p: 2.5,
        textAlign: 'center',
        color: 'white',
        position: 'relative',
      }}
    >
      {/* Decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 30,
          height: 30,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8rem',
        }}
      >
        📚
      </Box>
      <Avatar
        sx={{
          width: 70,
          height: 70,
          mx: 'auto',
          mb: 1.5,
          bgcolor: 'rgba(255,255,255,0.2)',
          fontSize: '1.5rem',
          fontWeight: 600,
        }}
      >
        SJ
      </Avatar>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
        {data.name}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
        {data.title}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.85rem' }}>
        University of Knowledge
      </Typography>
    </Box>

    <Box sx={{ p: 2.5, flexGrow: 1 }}>
      {/* Academic credentials */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: template.defaultColors?.primary }}>
          Specializations
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {['Data Science', 'Machine Learning', 'Statistics'].map((subject) => (
            <Chip
              key={subject}
              label={subject}
              size="small"
              sx={{
                bgcolor: template.defaultColors?.secondary,
                color: template.defaultColors?.primary,
                fontSize: '0.7rem',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Office Hours */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: template.defaultColors?.primary }}>
          Office Hours
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666', mb: 0.5 }}>
          Monday, Wednesday: 2:00 PM - 4:00 PM
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666' }}>
          By appointment: Tuesday, Thursday
        </Typography>
      </Box>

      {/* Contact */}
      <Box sx={{ mt: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon sx={{ fontSize: 16, color: template.defaultColors?.primary }} />
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{data.email}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon sx={{ fontSize: 16, color: template.defaultColors?.primary }} />
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Office: +1 (555) 123-4567</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  </Box>
);

// Retail Layout
const RetailLayout: React.FC<{ template: Template; data: any }> = ({ template, data }) => (
  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    {/* Store header */}
    <Box
      sx={{
        p: 2.5,
        textAlign: 'center',
        borderBottom: `3px solid ${template.defaultColors?.primary}`,
        bgcolor: '#fafafa',
      }}
    >
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 700, 
          color: template.defaultColors?.primary,
          mb: 1,
          fontFamily: '"Poppins", sans-serif',
        }}
      >
        Boutique Style Shop
      </Typography>
      <Avatar
        sx={{
          width: 60,
          height: 60,
          mx: 'auto',
          mb: 1,
          bgcolor: template.defaultColors?.primary,
          fontSize: '1.25rem',
        }}
      >
        SJ
      </Avatar>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
        {data.name}
      </Typography>
      <Typography variant="body2" sx={{ color: '#666' }}>
        Store Manager & Stylist
      </Typography>
    </Box>

    <Box sx={{ p: 2.5, flexGrow: 1 }}>
      {/* Store specialties */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: template.defaultColors?.primary }}>
          We Specialize In
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {['Fashion', 'Accessories', 'Personal Styling'].map((specialty) => (
            <Chip
              key={specialty}
              label={specialty}
              size="small"
              sx={{
                bgcolor: template.defaultColors?.primary,
                color: 'white',
                fontSize: '0.7rem',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Store hours */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: template.defaultColors?.primary }}>
          Store Hours
        </Typography>
        <Box sx={{ fontSize: '0.8rem', color: '#666' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Mon-Sat: 10:00 AM - 8:00 PM</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Sunday: 12:00 PM - 6:00 PM</Typography>
        </Box>
      </Box>

      {/* Special offer */}
      <Box sx={{ 
        p: 1.5, 
        bgcolor: template.defaultColors?.secondary, 
        borderRadius: 2, 
        mb: 2.5,
        textAlign: 'center'
      }}>
        <Typography variant="body2" sx={{ 
          fontWeight: 600, 
          color: template.defaultColors?.primary,
          fontSize: '0.8rem'
        }}>
          🛍️ 15% off first purchase with this card!
        </Typography>
      </Box>

      {/* Contact */}
      <Box sx={{ mt: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon sx={{ fontSize: 16, color: template.defaultColors?.primary }} />
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{data.phone}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon sx={{ fontSize: 16, color: template.defaultColors?.primary }} />
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>123 Fashion Ave, Style District</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  </Box>
);

// Hospitality Layout
const HospitalityLayout: React.FC<{ template: Template; data: any }> = ({ template, data }) => (
  <Box sx={{ height: '100%', position: 'relative' }}>
    {/* Warm background pattern */}
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '30%',
        background: `linear-gradient(135deg, ${template.defaultColors?.primary}, ${template.defaultColors?.secondary})`,
        opacity: 0.1,
      }}
    />

    <Box sx={{ p: 3, height: '100%', position: 'relative', zIndex: 1 }}>
      {/* Restaurant Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700, 
            color: template.defaultColors?.primary,
            fontFamily: '"Pacifico", cursive',
            mb: 1
          }}
        >
          Bella Vista Restaurant
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          {data.name}
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          Executive Chef & Owner
        </Typography>
      </Box>

      {/* Hours */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: template.defaultColors?.primary }}>
          Hours
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#666' }}>
          Tue - Sun: 5:00 PM - 10:00 PM
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#666' }}>
          Closed Mondays
        </Typography>
      </Box>

      {/* Cuisine */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: template.defaultColors?.primary }}>
          Cuisine
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0.5 }}>
          {['Italian', 'Mediterranean', 'Farm-to-Table'].map((cuisine) => (
            <Chip
              key={cuisine}
              label={cuisine}
              size="small"
              sx={{
                bgcolor: template.defaultColors?.secondary,
                color: template.defaultColors?.primary,
                fontSize: '0.7rem',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Contact */}
      <Box sx={{ mt: 'auto', textAlign: 'center' }}>
        <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.5 }}>
          📞 {data.phone}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.5 }}>
          📧 {data.email}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
          📍 123 Culinary Street, Food District
        </Typography>
      </Box>
    </Box>
  </Box>
);

// Default Layout
const DefaultLayout: React.FC<{ template: Template; data: any }> = ({ template, data }) => (
  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Box
      sx={{
        background: `linear-gradient(135deg, ${template.defaultColors?.primary}, ${template.defaultColors?.secondary})`,
        p: 3,
        color: 'white',
        textAlign: 'center',
      }}
    >
      <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
        SJ
      </Avatar>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {data.name}
      </Typography>
      <Typography variant="body2">{data.title}</Typography>
    </Box>
    
    <Box sx={{ p: 2.5, flexGrow: 1 }}>
      <Typography variant="body2" sx={{ mb: 2, fontSize: '0.85rem' }}>
        {data.bio}
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>📧 {data.email}</Typography>
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>📞 {data.phone}</Typography>
      </Box>
    </Box>
  </Box>
);

export default TemplatePreview;