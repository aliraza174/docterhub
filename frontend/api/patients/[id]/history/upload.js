import { connectToDatabase } from '../../../utils/db';
import { MedicalHistory } from '../../../models/MedicalHistory';
import { verifyAuth, setCorsHeaders } from '../../../utils/auth';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectToDatabase();
  const user = await verifyAuth(req, res, 'patient');
  if (!user) return;

  const patientId = req.query.id; // dynamic routing param
  const { title, description, record_type, file_path } = req.body;

  if (String(user.id) !== String(patientId)) {
    return res.status(403).json({ error: 'You are unauthorized to upload documents to another patient\'s timeline' });
  }

  if (!title || !record_type || !['report', 'lab_result'].includes(record_type)) {
    return res.status(400).json({ error: 'Title and record type (report or lab_result) are required' });
  }

  try {
    const historyEntry = new MedicalHistory({
      patient_id: patientId,
      doctor_id: null,
      record_type,
      record_id: null,
      title,
      description: description || '',
      file_path: file_path || null
    });

    await historyEntry.save();
    res.status(201).json({ message: 'Medical record uploaded to history timeline successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload medical record' });
  }
}
