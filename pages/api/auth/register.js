import { registerUser } from '../../../lib/auth';
import cookie from 'cookie';

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    
    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    // Register the user
    const user = await registerUser(email, password);
    
    // Return the new user (without password)
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        userId: user.userId,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific errors
    if (error.message === 'User already exists') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    if (error.message.includes('Database setup required')) {
      return res.status(503).json({ 
        error: 'The database is not set up yet. Please wait while the system is being initialized.' 
      });
    }
    
    if (error.name === 'ResourceNotFoundException' || 
        error.message.includes('Database error')) {
      return res.status(503).json({ 
        error: 'The database service is temporarily unavailable. Please try again later.' 
      });
    }
    
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}
