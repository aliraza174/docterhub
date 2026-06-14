import { connectToDatabase } from '../../../utils/db';
import { Clinic } from '../../../models/Clinic';
import { verifyAuth, setCorsHeaders } from '../../../utils/auth';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectToDatabase();
  const user = await verifyAuth(req, res, 'doctor');
  if (!user) return;

  const clinicId = req.query.id; // dynamic routing param
  const { schedule, name, address } = req.body;

  try {
    const clinic = await Clinic.findById(clinicId);
    if (!clinic || clinic.doctor_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized clinic modification' });
    }

    clinic.name = name;
    clinic.address = address;
    clinic.schedule = schedule;
    await clinic.save();

    res.json({ message: 'Clinic details and schedule updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Clinic update failed' });
  }
}
