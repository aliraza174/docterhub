import { connectToDatabase } from '../utils/db';
import { User } from '../models/User';
import { Doctor } from '../models/Doctor';
import { Clinic } from '../models/Clinic';
import { setCorsHeaders } from '../utils/auth';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectToDatabase();
  const { specialty, disease, search } = req.query;

  try {
    const query = {};

    if (specialty) {
      query.specialty = specialty;
    }

    if (disease) {
      query.disease_focus = { $regex: disease, $options: 'i' };
    }

    if (search) {
      // Find matching users first since names are in the User collection
      const matchingUsers = await User.find({
        role: 'doctor',
        name: { $regex: search, $options: 'i' }
      });
      const matchingUserIds = matchingUsers.map(u => u._id.toString());
      query.$or = [
        { id: { $in: matchingUserIds } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    const doctors = await Doctor.find(query);
    const doctorsList = [];

    for (const d of doctors) {
      const u = await User.findById(d.id);
      if (!u) continue;
      const c = await Clinic.findOne({ doctor_id: d.id });

      doctorsList.push({
        id: d.id,
        name: u.name,
        email: u.email,
        specialty: d.specialty,
        disease_focus: d.disease_focus,
        experience: d.experience,
        bio: d.bio,
        fees: d.fees,
        rating: d.rating,
        avatar_url: d.avatar_url,
        clinic_name: c ? c.name : '',
        clinic_address: c ? c.address : '',
        clinic_id: c ? c._id.toString() : ''
      });
    }

    res.json(doctorsList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve doctors list' });
  }
}
