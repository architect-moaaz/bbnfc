require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../models/Template');

// DHL-branded SVG thumbnail (self-contained, no external asset needed)
const thumbnailSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
  <rect width="300" height="200" fill="#FFCC00"/>
  <rect x="0" y="60" width="300" height="6" fill="#D40511"/>
  <text x="24" y="46" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="bold" font-style="italic" fill="#D40511">DHL</text>
  <text x="232" y="42" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="bold" letter-spacing="2" fill="#D40511">GROUP</text>
  <rect x="24" y="92" width="56" height="56" rx="8" fill="#D40511"/>
  <text x="34" y="128" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="bold" fill="#FFCC00">AW</text>
  <text x="96" y="116" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="bold" fill="#1A1A1A">Alexandra Weber</text>
  <text x="96" y="138" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#D40511">VP, Global Logistics</text>
</svg>`;
const thumbnail = `data:image/svg+xml;base64,${Buffer.from(thumbnailSvg).toString('base64')}`;

const dhlTemplate = {
  name: 'DHL Express',
  slug: 'dhl-express',
  description: 'Official DHL-branded corporate card with the group wordmark, tagline and yellow/red identity.',
  category: 'corporate',
  thumbnail,
  structure: {
    layout: 'card',
    sections: [
      { id: 'header', type: 'header', order: 1, config: { showTitle: true, showCompany: true } },
      { id: 'contact', type: 'contact', order: 2, config: { layout: 'vertical' } },
      { id: 'social', type: 'social', order: 3, config: { style: 'rows' } },
      { id: 'cta', type: 'cta', order: 4, config: { text: 'Save to Contacts' } },
    ],
  },
  defaultColors: {
    primary: '#D40511',   // DHL red
    secondary: '#FFCC00', // DHL yellow
    text: '#1A1A1A',
    background: '#FFFFFF',
  },
  defaultFonts: {
    heading: 'Helvetica Neue',
    body: 'Helvetica Neue',
  },
  features: [],
  isPremium: true,
  isActive: true,
};

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-business-card');
    const existing = await Template.findOne({ slug: dhlTemplate.slug });
    if (existing) {
      await Template.updateOne({ slug: dhlTemplate.slug }, { $set: dhlTemplate });
      console.log('🔁 Updated existing DHL Express template');
    } else {
      const t = await Template.create(dhlTemplate);
      console.log(`✅ Created DHL Express template (${t._id})`);
    }
    const total = await Template.countDocuments({ isActive: true });
    console.log(`Total active templates: ${total}`);
    process.exit(0);
  } catch (err) {
    console.error('DHL template creation failed:', err);
    process.exit(1);
  }
}

run();
