import { connectToDatabase } from '../../utils/db';
import { Assistant } from '../../models/Assistant';
import { verifyAuth, setCorsHeaders } from '../../utils/auth';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectToDatabase();
  const user = await verifyAuth(req, res, 'admin', 'super_admin');
  if (!user) return;

  const { assistant_id, doctor_id } = req.body;

  if (!assistant_id || !doctor_id) {
    return res.status(400).json({ error: 'Assistant ID and Doctor ID are required' });
  }

  try {
    let assistant = await Assistant.findOne({ id: assistant_id });
    if (!assistant) {
      // create profile if somehow missing
      assistant = new Assistant({
        id: assistant_id,
        doctor_id
      });
      await assistant.save();
    } else {
      assistant.doctor_id = doctor_id;
      await assistant.save();
    }

    res.json({ message: 'Assistant successfully assigned to doctor!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to assign assistant' });
  }
}
