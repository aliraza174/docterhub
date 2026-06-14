import { connectToDatabase } from '../utils/db';
import { User } from '../models/User';
import { setCorsHeaders } from '../utils/auth';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectToDatabase();
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User with this email does not exist' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    user.password_hash = passwordHash;
    await user.save();

    res.json({ message: 'Password updated successfully! You can now log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Reset password failed' });
  }
}
