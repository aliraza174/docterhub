import { connectToDatabase } from '../../../utils/db';
import { User } from '../../../models/User';
import { verifyAuth, setCorsHeaders } from '../../../utils/auth';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectToDatabase();
  const user = await verifyAuth(req, res, 'super_admin');
  if (!user) return;

  const targetUserId = req.query.id; // dynamic routing param
  const { role } = req.body;

  if (!['patient', 'doctor', 'assistant', 'admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    targetUser.role = role;
    await targetUser.save();

    res.json({ message: 'User role updated successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
}
