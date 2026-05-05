import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { verifyAccessToken } from '../utils/jwt.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : req.cookies?.accessToken;
  if (!token) throw new ApiError(401, 'Authentication required');

  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.id).select('-passwordHash');
  if (!user) throw new ApiError(401, 'Invalid token user');
  req.user = user;
  next();
});
