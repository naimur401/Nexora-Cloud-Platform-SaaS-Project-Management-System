import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../types';

// Temporary in-memory user storage (পরে ডাটাবেসে নেবো)
let users: any[] = [
  {
    id: 1,
    name: 'Super Admin',
    email: 'admin@nexora.com',
    password: bcrypt.hashSync('admin123', 10),
    role: 'SUPER_ADMIN',
    companyId: null,
    createdAt: new Date()
  },
  {
    id: 2,
    name: 'Company Admin',
    email: 'company@test.com',
    password: bcrypt.hashSync('company123', 10),
    role: 'COMPANY_ADMIN',
    companyId: 1,
    createdAt: new Date()
  }
];

let refreshTokens: string[] = [];

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'TEAM_MEMBER', companyId = null } = req.body;

    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      id: users.length + 1,
      name,
      email,
      password: hashedPassword,
      role,
      companyId,
      createdAt: new Date()
    };

    users.push(newUser);

    // Generate tokens
    const payload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      companyId: newUser.companyId
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    refreshTokens.push(refreshToken);

    // Set refresh token in cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
        accessToken
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate tokens
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    refreshTokens.push(refreshToken);

    // Set refresh token in cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        accessToken
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token required' 
      });
    }

    if (!refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid refresh token' 
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired refresh token' 
      });
    }

    const user = users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    };

    const newAccessToken = generateAccessToken(payload);

    res.json({
      success: true,
      data: { accessToken: newAccessToken }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Token refresh failed' 
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      const index = refreshTokens.indexOf(refreshToken);
      if (index > -1) {
        refreshTokens.splice(index, 1);
      }
    }

    res.clearCookie('refreshToken');
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Logout failed' 
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = users.find(u => u.id === req.user?.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ 
      success: true, 
      data: userWithoutPassword 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get user info' 
    });
  }
};