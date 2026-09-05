import React, { useEffect, useState } from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import {
  PhoneOutlined as PhoneIcon,
  MailOutline as EmailIcon,
  ChatBubbleOutline as WhatsAppIcon,
  LinkedIn as LinkedInIcon,
  LanguageOutlined as WebsiteIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { Profile } from '../../types';

/**
 * DHL-branded digital business card template.
 *
 * The brand "chrome" (wordmark, tagline, colours, footer group name) is fixed to
 * DHL's identity, while all person/contact data is pulled from the profile. It is
 * rendered by PublicProfileRedesigned when the profile's template slug is
 * `dhl-express`.
 */

// ---- DHL brand tokens -------------------------------------------------------
const DHL = {
  yellow: '#FFCC00',
  red: '#D40511',
  ink: '#1A1A1A',
  muted: '#6B6B6B',
  line: '#ECECEC',
  white: '#FFFFFF',
  // Person/contact data uses a geometric sans (Poppins) to match the design.
  font: '"Poppins", "Helvetica Neue", Arial, sans-serif',
  // The DHL wordmark/tagline stay on a neo-grotesque, close to DHL "Delivery".
  brand: '"Helvetica Neue", Helvetica, Arial, sans-serif',
};

const TAGLINE = 'EXCELLENCE. SIMPLY DELIVERED.';
const GROUP_NAME = 'DHL Group';

interface ContactRow {
  key: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  action: 'COPY' | 'OPEN';
  onClick: () => void;
}

interface DHLTemplateProps {
  profile: Profile;
  onSaveContact: () => void;
  onTrack?: (eventType: string, data?: any) => void;
}

const DHLTemplate: React.FC<DHLTemplateProps> = ({ profile, onSaveContact, onTrack }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [qrDataUrl, setQrDataUrl] = useState<string>(profile.qrCode || '');
  const [copied, setCopied] = useState<string | null>(null);

  const { personalInfo, contactInfo, socialLinks } = profile;
  const fullName = `${personalInfo.firstName} ${personalInfo.lastName}`.trim();
  const initials = `${personalInfo.firstName?.[0] || ''}${personalInfo.lastName?.[0] || ''}`.toUpperCase();

  // Footer location from the address, defaulting to DHL HQ.
  const city = contactInfo.address?.city;
  const country = contactInfo.address?.country;
  const location = (city || country)
    ? [city, country].filter(Boolean).join(', ').toUpperCase()
    : 'BONN, DE';

  // Generate a QR for the live card URL if the profile has no stored QR.
  useEffect(() => {
    if (profile.qrCode) {
      setQrDataUrl(profile.qrCode);
      return;
    }
    QRCode.toDataURL(window.location.href, {
      width: 240,
      margin: 1,
      color: { dark: DHL.ink, light: DHL.white },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [profile.qrCode]);

  const track = (type: string, data?: any) => onTrack?.(type, data);

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      track('click', { elementClicked: `copy_${key}` });
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  const open = (key: string, url: string) => {
    track('click', { elementClicked: key });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // A WhatsApp value may live in socialLinks.custom (platform contains "whatsapp").
  const whatsapp = socialLinks?.custom?.find((l) =>
    l.platform?.toLowerCase().includes('whatsapp')
  )?.url;
  const website =
    contactInfo.website ||
    socialLinks?.custom?.find((l) => l.platform?.toLowerCase().includes('website'))?.url;

  // Build contact rows from whatever data exists.
  const rows: ContactRow[] = [];
  if (contactInfo.phone) {
    rows.push({
      key: 'phone', label: 'PHONE', value: contactInfo.phone, icon: <PhoneIcon />,
      action: 'COPY', onClick: () => copy('phone', contactInfo.phone!),
    });
  }
  if (contactInfo.email) {
    rows.push({
      key: 'email', label: 'EMAIL', value: contactInfo.email, icon: <EmailIcon />,
      action: 'COPY', onClick: () => copy('email', contactInfo.email!),
    });
  }
  if (whatsapp) {
    rows.push({
      key: 'whatsapp', label: 'WHATSAPP', value: whatsapp, icon: <WhatsAppIcon />,
      action: 'OPEN',
      onClick: () => open('whatsapp', `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`),
    });
  }
  if (socialLinks?.linkedin) {
    const li = socialLinks.linkedin;
    rows.push({
      key: 'linkedin', label: 'LINKEDIN', value: li.replace(/^https?:\/\//, ''), icon: <LinkedInIcon />,
      action: 'OPEN',
      onClick: () => open('linkedin', li.startsWith('http') ? li : `https://${li}`),
    });
  }
  if (website) {
    rows.push({
      key: 'website', label: 'WEBSITE', value: website.replace(/^https?:\/\//, ''), icon: <WebsiteIcon />,
      action: 'OPEN',
      onClick: () => open('website', website.startsWith('http') ? website : `https://${website}`),
    });
  }

  const iconTileSx = {
    width: 44, height: 44, flexShrink: 0, borderRadius: '10px',
    backgroundColor: DHL.yellow, color: DHL.red,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    '& svg': { fontSize: 22 },
  } as const;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#EDEDED',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        py: { xs: 0, sm: 5 },
        px: { xs: 0, sm: 2 },
        fontFamily: DHL.font,
      }}
    >
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        sx={{
          width: '100%',
          maxWidth: 460,
          backgroundColor: DHL.white,
          borderRadius: { xs: 0, sm: '14px' },
          overflow: 'hidden',
          boxShadow: { xs: 'none', sm: '0 12px 40px rgba(0,0,0,0.16)' },
          fontFamily: DHL.font,
        }}
      >
        {/* ---- Header band ---- */}
        <Box
          sx={{
            backgroundColor: DHL.yellow,
            px: 3.5, pt: 3.5, pb: 3,
            borderBottom: `5px solid ${DHL.red}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <Typography
              component="span"
              sx={{
                fontFamily: DHL.brand, fontWeight: 800, color: DHL.red,
                fontSize: 40, lineHeight: 1, letterSpacing: '-1px', fontStyle: 'italic',
              }}
            >
              DHL
            </Typography>
          </Box>
          <Typography
            sx={{ fontFamily: DHL.brand, fontWeight: 800, color: DHL.ink, fontSize: 17, letterSpacing: '0.2px', mt: 1.25 }}
          >
            {TAGLINE}
          </Typography>
        </Box>

        {/* ---- Body ---- */}
        <Box sx={{ px: 3.5, pt: 3.5, pb: 3.5 }}>
          {/* Identity */}
          <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center', mb: 3.5 }}>
            <Box
              sx={{
                width: 88, height: 88, flexShrink: 0, borderRadius: '10px',
                backgroundColor: DHL.yellow, color: DHL.red,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: DHL.font, fontWeight: 800, fontSize: 34, letterSpacing: '-1px',
                overflow: 'hidden',
              }}
            >
              {personalInfo.profilePhoto ? (
                <Box component="img" src={personalInfo.profilePhoto} alt={fullName}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials || 'DHL'
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{ fontFamily: DHL.font, fontWeight: 700, color: DHL.ink, fontSize: 25, lineHeight: 1.15, letterSpacing: '-0.3px' }}
              >
                {fullName || 'Your Name'}
              </Typography>
              {personalInfo.title && (
                <Typography sx={{ fontFamily: DHL.font, fontWeight: 700, color: DHL.red, fontSize: 16, mt: 0.75 }}>
                  {personalInfo.title}
                </Typography>
              )}
              {personalInfo.company && (
                <Typography sx={{ fontFamily: DHL.font, fontWeight: 400, color: DHL.muted, fontSize: 15, mt: 0.25 }}>
                  {personalInfo.company}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Contact rows */}
          <Box sx={{ borderTop: `1px solid ${DHL.line}` }}>
            {rows.map((row, i) => (
              <Box
                key={row.key}
                component={motion.div}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.15 + i * 0.06 }}
                onClick={row.onClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') row.onClick(); }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  py: 2, borderBottom: `1px solid ${DHL.line}`,
                  cursor: 'pointer', outline: 'none',
                  transition: 'background-color 0.15s ease',
                  '&:hover': { backgroundColor: '#FFFBEA' },
                }}
              >
                <Box sx={iconTileSx}>{row.icon}</Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography sx={{ fontFamily: DHL.font, fontWeight: 700, color: DHL.muted, fontSize: 11, letterSpacing: '1px' }}>
                    {row.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: DHL.font, fontWeight: 600, color: DHL.ink, fontSize: 16,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    {row.value}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: DHL.font, fontWeight: 700, fontSize: 12, letterSpacing: '1px', flexShrink: 0,
                    color: copied === row.key ? DHL.red : DHL.muted,
                  }}
                >
                  {copied === row.key ? 'COPIED' : row.action}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Save to contacts */}
          <Box
            component={motion.button}
            whileTap={{ scale: 0.985 }}
            onClick={() => { track('click', { elementClicked: 'save_contact' }); onSaveContact(); }}
            sx={{
              mt: 3.5, width: '100%', border: 'none', cursor: 'pointer',
              backgroundColor: DHL.red, color: DHL.white,
              fontFamily: DHL.font, fontWeight: 800, fontSize: 16, letterSpacing: '1px',
              py: 2, borderRadius: '10px',
              transition: 'background-color 0.15s ease',
              '&:hover': { backgroundColor: '#B00410' },
            }}
          >
            SAVE TO CONTACTS
          </Box>

          {/* QR */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mt: 3.5 }}>
            {qrDataUrl && (
              <Box
                component="img"
                src={qrDataUrl}
                alt="Scan to connect"
                sx={{ width: 96, height: 96, flexShrink: 0, borderRadius: '8px', border: `1px solid ${DHL.line}`, p: 0.5 }}
              />
            )}
            <Box>
              <Typography sx={{ fontFamily: DHL.font, fontWeight: 800, color: DHL.ink, fontSize: 17 }}>
                Scan to connect
              </Typography>
              <Typography sx={{ fontFamily: DHL.font, fontWeight: 400, color: DHL.muted, fontSize: 14, mt: 0.5 }}>
                Open this card on any device.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ---- Footer band ---- */}
        <Box
          sx={{
            backgroundColor: DHL.yellow,
            px: 3.5, py: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
          }}
        >
          <Typography sx={{ fontFamily: DHL.font, fontWeight: 600, color: DHL.ink, fontSize: 13 }}>
            {GROUP_NAME}
          </Typography>
          <Typography sx={{ fontFamily: DHL.font, fontWeight: 800, color: DHL.red, fontSize: 13, letterSpacing: '0.5px' }}>
            {location}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default DHLTemplate;
