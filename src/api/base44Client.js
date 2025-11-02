import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "686998ee6a717e0ca083f355", 
  requiresAuth: true // Ensure authentication is required for all operations
});
