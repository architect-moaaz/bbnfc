-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar TEXT,
  is_email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token TEXT,
  email_verification_expire TIMESTAMP,
  password_reset_token TEXT,
  password_reset_expire TIMESTAMP,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  features JSONB DEFAULT '{
    "maxProfiles": 1,
    "maxCardsPerProfile": 1,
    "analytics": false,
    "customDomain": false,
    "teamMembers": 0,
    "apiAccess": false,
    "premiumTemplates": false,
    "removeWatermark": false
  }',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Profiles table
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  title VARCHAR(100),
  company VARCHAR(100),
  bio TEXT,
  email VARCHAR(255),
  phone VARCHAR(20),
  website TEXT,
  linkedin TEXT,
  twitter TEXT,
  instagram TEXT,
  facebook TEXT,
  youtube TEXT,
  tiktok TEXT,
  address JSONB,
  business_hours JSONB DEFAULT '[]',
  show_hours BOOLEAN DEFAULT FALSE,
  avatar TEXT,
  logo TEXT,
  customization JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Templates table
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  preview_image TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  default_colors JSONB DEFAULT '{}',
  default_fonts JSONB DEFAULT '{}',
  layout_config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cards table
CREATE TABLE cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'digital' CHECK (type IN ('digital', 'physical')),
  design JSONB DEFAULT '{}',
  qr_code TEXT,
  nfc_data TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics table
CREATE TABLE analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  visitor_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  city TEXT,
  device_type VARCHAR(20),
  action_type VARCHAR(50),
  action_data JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_cards_profile_id ON cards(profile_id);
CREATE INDEX idx_analytics_profile_id ON analytics(profile_id);
CREATE INDEX idx_analytics_created_at ON analytics(created_at);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();