import { createUser, getUserByEmail } from './aws';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import * as cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-jwt-key-change-in-production';

// Register a new user
export async function registerUser(email, password) {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generate unique ID
    const userId = uuidv4();
    
    try {
      // Create user in DynamoDB
      await createUser({
        userId,
        email,
        password: hashedPassword,
      });
      
      return { userId, email };
    } catch (dbError) {
      console.error('Database error during user creation:', dbError);
      // If it's our custom error, pass it through
      if (dbError.message.includes('Database setup required')) {
        throw dbError;
      }
      // Otherwise, throw a generic error
      throw new Error('Registration failed. Database error.');
    }
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

// Login a user
export async function loginUser(email, password) {
  try {
    try {
      // Find user by email
      const user = await getUserByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }
      
      // Create JWT token
      const token = jwt.sign(
        { userId: user.userId, email: user.email },
        JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      return { token, user: { userId: user.userId, email: user.email } };
    } catch (dbError) {
      // If it's a database connectivity issue, rethrow a more specific error
      if (dbError.name === 'ResourceNotFoundException') {
        console.error('Database table not found during login:', dbError);
        throw new Error('Database service unavailable. Please try again later.');
      }
      // Otherwise pass the error through
      throw dbError;
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Verify JWT token
export function verifyToken(token) {
  try {
    console.log('Verifying token with secret:', JWT_SECRET.substring(0, 3) + '...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully');
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

// Parse authorization header
export function parseAuthHeader(req) {
  console.log('Auth header:', req.headers.authorization);
  
  if (!req.headers.authorization) {
    if (req.cookies && req.cookies.token) {
      console.log('Using token from cookies');
      return verifyToken(req.cookies.token);
    }
    console.log('No authorization header or cookie found');
    return null;
  }
  
  console.log('Using token from Authorization header');
  const token = req.headers.authorization.replace('Bearer ', '');
  const user = verifyToken(token);
  console.log('Verified user:', user);
  return user;
}

// Set auth cookies
export function setAuthCookies(res, token) {
  res.setHeader('Set-Cookie', cookie.serialize('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: 'strict',
    path: '/',
  }));
}

// Clear auth cookies
export function clearAuthCookies(res) {
  res.setHeader('Set-Cookie', cookie.serialize('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    maxAge: -1,
    sameSite: 'strict',
    path: '/',
  }));
}

// Authentication middleware for API routes
export function withAuth(handler) {
  return async (req, res) => {
    try {
      console.log('Auth middleware triggered for:', req.url);
      const user = parseAuthHeader(req);
      
      if (!user) {
        console.log('Auth middleware: No user found, returning 401');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      console.log('Auth middleware: User authenticated:', user.userId);
      req.user = user;
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}
