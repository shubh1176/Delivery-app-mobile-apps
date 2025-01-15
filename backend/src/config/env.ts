import dotenv from 'dotenv';
import path from 'path';

// Load environment variables as early as possible
const envPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Failed to load .env file:', result.error);
  process.exit(1);
}

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  mapbox: {
    accessToken: process.env.MAPBOX_ACCESS_TOKEN,
    geocodingUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
    directionsUrl: 'https://api.mapbox.com/directions/v5/mapbox'
  }
};

// Validate required configuration
const requiredConfig = {
  mongodbUri: config.mongodbUri,
  jwtSecret: config.jwtSecret,
  mapboxAccessToken: config.mapbox.accessToken
};

const missingConfig = Object.entries(requiredConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingConfig.length > 0) {
  console.error('Missing required configuration:', missingConfig);
  process.exit(1);
}

export default config; 