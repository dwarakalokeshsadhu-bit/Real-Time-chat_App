import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { signAccessToken } from '../utils/jwt.js';
import { env } from '../config/env.js';
import { getIO } from '../sockets/index.js';

const cleanUser = user => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  avatarUrl: user.avatarUrl,
  status: user.status,
  authProvider: user.authProvider
});

const oauthProviders = {
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid profile email'
  }
};

const redirectUri = provider => `${env.API_URL}/api/v1/auth/${provider}/callback`;

function getProvider(provider) {
  const config = oauthProviders[provider];
  if (!config) throw new ApiError(404, 'Unsupported authentication provider');
  if (!config.clientId || !config.clientSecret) throw new ApiError(500, `${provider} login is not configured`);
  return config;
}

function normalizeProfile(provider, profile) {
  return {
    providerId: profile.sub,
    email: profile.email,
    username: profile.name || profile.given_name || profile.email?.split('@')[0],
    avatarUrl: profile.picture || ''
  };
}

async function findOrCreateOAuthUser(provider, profile) {
  const normalized = normalizeProfile(provider, profile);
  if (!normalized.providerId || !normalized.email) throw new ApiError(400, 'Social profile did not include required account details');

  let user = await User.findOne({
    $or: [
      { authProvider: provider, providerId: normalized.providerId },
      { email: normalized.email.toLowerCase() }
    ]
  });

  if (user) {
    user.authProvider = user.authProvider || provider;
    user.providerId = user.providerId || normalized.providerId;
    user.avatarUrl = user.avatarUrl || normalized.avatarUrl;
    await user.save();
    return user;
  }

  const count = await User.countDocuments();
  return User.create({
    username: normalized.username,
    email: normalized.email,
    authProvider: provider,
    providerId: normalized.providerId,
    avatarUrl: normalized.avatarUrl,
    role: count === 0 ? 'admin' : 'member'
  });
}

export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) throw new ApiError(400, 'username, email and password are required');
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'Email already registered');
  const count = await User.countDocuments();
  const user = await User.create({ username, email, passwordHash: await bcrypt.hash(password, 10), role: count === 0 ? 'admin' : 'member' });
  res.status(201).json({ success: true, user: cleanUser(user), accessToken: signAccessToken(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  console.log("BODY:",req.body);
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) throw new ApiError(401, 'Invalid email or password');
  res.json({ success: true, user: cleanUser(user), accessToken: signAccessToken(user) });
});

export const startOAuth = asyncHandler(async (req, res) => {
  const providerName = req.params.provider;
  const provider = getProvider(providerName);
  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: redirectUri(providerName),
    response_type: 'code',
    scope: provider.scope,
    state: providerName
  });

  res.redirect(`${provider.authorizeUrl}?${params.toString()}`);
});

export const oauthCallback = asyncHandler(async (req, res) => {
  const providerName = req.params.provider;
  const provider = getProvider(providerName);

  if (!req.query.code) throw new ApiError(400, 'Missing OAuth code');

  const tokenResponse = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: req.query.code,
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      redirect_uri: redirectUri(providerName),
      grant_type: 'authorization_code'
    })
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) throw new ApiError(401, 'Social login failed');

  const profileResponse = await fetch(provider.userInfoUrl, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });

  const profile = await profileResponse.json();
  if (!profileResponse.ok) throw new ApiError(401, 'Could not read social profile');

  const user = await findOrCreateOAuthUser(providerName, profile);
  const accessToken = signAccessToken(user);
  const params = new URLSearchParams({
    accessToken,
    user: JSON.stringify(cleanUser(user))
  });

  res.redirect(`${env.CLIENT_URL}/?${params.toString()}`);
});

export const logout = asyncHandler(async (req, res) => res.json({ success: true, message: 'Logged out' }));
export const currentUser = asyncHandler(async (req, res) => res.json({ success: true, user: cleanUser(req.user) }));
export const searchUsers = asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (query.length < 2) return res.json({ success: true, users: [] });

  const users = await User.find({
    _id: { $ne: req.user._id },
    username: { $regex: query, $options: 'i' }
  })
    .select('username avatarUrl status')
    .limit(10);

  res.json({ success: true, users });
});
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Profile picture is required');
  if (!req.file.mimetype?.startsWith('image/')) throw new ApiError(400, 'Please upload an image file');

  const avatarUrl = `${env.API_URL}/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatarUrl },
    { new: true }
  );

  getIO()?.emit('user:avatarUpdated', {
    username: user.username,
    avatarUrl: user.avatarUrl
  });

  res.json({ success: true, user: cleanUser(user) });
});
export const refreshToken = asyncHandler(async (req, res) => res.status(501).json({ success: false, message: 'Refresh token rotation placeholder', statusCode: 501 }));
