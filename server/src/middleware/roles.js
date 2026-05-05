import { ApiError } from '../utils/errors.js';

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) throw new ApiError(403, 'Permission denied');
    next();
  };
}
