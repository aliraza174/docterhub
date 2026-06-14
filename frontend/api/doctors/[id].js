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
  const { id } = req.query; // dynamic routing param

  try {
    const doctorProfile = await Doctor.findOne({ id: id });
    const userProfile = await User.findOne({ _id: id, role: 'doctor' });

    if (!doctorProfile || !userProfile) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const doctorData = {
      name: userProfile.name,
      email: userProfile.email,
      id: doctorProfile.id,
      specialty: doctorProfile.specialty,
      disease_focus: doctorProfile.disease_focus,
      experience: doctorProfile.experience,
      bio: doctorProfile.bio,
      fees: doctorProfile.fees,
      rating: doctorProfile.rating,
      avatar_url: doctorProfile.avatar_url
    };

    const clinics = await Clinic.find({ doctor_id: id });
    const formattedClinics = clinics.map(c => ({
      id: c._id.toString(),
      doctor_id: c.doctor_id,
      name: c.name,
      address: c.address,
      schedule: typeof c.schedule === 'string' ? JSON.parse(c.schedule) : c.schedule
    }));

    res.json({ doctor: doctorData, clinics: formattedClinics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve doctor details' });
  }
}
