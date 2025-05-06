import { loginUser, setAuthCookies } from '../../../lib/auth';

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
    
    // Authenticate user
    const { token, user } = await loginUser(email, password);
    
    // Set HTTP-only cookie with the token
    setAuthCookies(res, token);
    
    // Return token and user info
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific errors
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Handle DynamoDB resource errors
    if (error.name === 'ResourceNotFoundException' || 
        error.message.includes('Database setup required') || 
        error.$metadata?.httpStatusCode === 400) {
      return res.status(503).json({ 
        error: 'The database service is temporarily unavailable. Please try again later.' 
      });
    }
    
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}
