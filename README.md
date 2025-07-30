# NFC Business Card Platform

A full-stack digital business card platform built with React, Node.js, Express, and MongoDB.

## Features

- 🎨 Multiple professional templates
- 📱 Responsive design
- 🔗 NFC and QR code support
- 📊 Analytics dashboard  
- 👥 User management
- 🎛️ Admin panel
- 📤 vCard export
- 🏢 Business hours management

## Tech Stack

### Frontend
- React 19 with TypeScript
- Material-UI (MUI)
- React Router
- React Query
- Framer Motion
- Chart.js

### Backend
- Node.js & Express
- MongoDB with Mongoose
- JWT Authentication
- Cloudinary (image upload)
- QR Code generation
- Rate limiting & security

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nfc-business-card-platform
```

2. Install dependencies:
```bash
npm run install-all
```

3. Set up environment variables:
```bash
# Copy the example file
cp .env.example backend/.env

# Edit backend/.env with your values
```

4. Start development servers:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Deployment on Vercel

### Prerequisites
- Vercel account
- MongoDB Atlas database
- GitHub repository

### Step 1: Prepare Your Repository

Ensure all the configuration files are in place:
- `vercel.json` - Vercel deployment configuration
- `api/index.js` - Serverless API handler
- `frontend/.env.production` - Production environment variables

### Step 2: Deploy to Vercel

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Import your repository

2. **Configure Environment Variables:**
   
   In your Vercel project settings, add these environment variables:

   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://m:to7kXzNixG4y78CB@cluster0.dbmqmws.mongodb.net/?retryWrites=true&w=majority&appName=cluster0
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   JWT_EXPIRE=30d
   FRONTEND_URL=https://your-app-name.vercel.app
   ```

   Optional (for full functionality):
   ```
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   STRIPE_SECRET_KEY=your-stripe-secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

3. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

### Step 3: Initialize Database

After deployment, you need to create the initial templates:

1. Use Vercel's serverless function or connect directly to your MongoDB Atlas cluster
2. Run the template creation script:

```javascript
// You can run this in a MongoDB client or create a one-time API endpoint
db.templates.insertMany([
  // Template data will be inserted here
])
```

### Step 4: Update Domain Settings

1. In Vercel dashboard, go to your project settings
2. Update the `FRONTEND_URL` environment variable with your actual Vercel domain
3. Redeploy if necessary

## Project Structure

```
├── api/                    # Vercel serverless functions
├── backend/               # Express.js backend
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   └── utils/            # Utility functions
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
└── vercel.json           # Vercel configuration
```

## Environment Variables

### Backend Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRE` - JWT expiration time
- `FRONTEND_URL` - Frontend URL for CORS
- `CLOUDINARY_*` - Image upload service
- `STRIPE_*` - Payment processing
- `EMAIL_*` - Email service configuration

### Frontend Variables
- `REACT_APP_API_URL` - Backend API URL

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Profiles
- `GET /api/profiles` - Get user profiles
- `POST /api/profiles` - Create profile
- `PUT /api/profiles/:id` - Update profile
- `DELETE /api/profiles/:id` - Delete profile

### Public Access
- `GET /p/:profileId` - Public profile view
- `GET /p/:profileId/vcard` - Download vCard

### Templates
- `GET /api/templates` - Get available templates
- `POST /api/templates` - Create template (admin)

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - Get all users
- `GET /api/admin/profiles` - Get all profiles

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.