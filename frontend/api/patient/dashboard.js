import { connectToDatabase } from '../utils/db';
import { Patient } from '../models/Patient';
import { Appointment } from '../models/Appointment';
import { User } from '../models/User';
import { Doctor } from '../models/Doctor';
import { Clinic } from '../models/Clinic';
import { verifyAuth, setCorsHeaders } from '../utils/auth';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectToDatabase();
  const user = await verifyAuth(req, res, 'patient');
  if (!user) return;

  const patientId = user.id;

  try {
    const profile = await Patient.findOne({ id: patientId });
    const appointments = await Appointment.find({ patient_id: patientId }).sort({ date: -1, time_slot: -1 });

    const formattedAppointments = [];
    for (const a of appointments) {
      const docUser = await User.findById(a.doctor_id);
      const docProfile = await Doctor.findOne({ id: a.doctor_id });
      const clinic = await Clinic.findById(a.clinic_id);

      formattedAppointments.push({
        id: a._id.toString(),
        patient_id: a.patient_id,
        doctor_id: a.doctor_id,
        clinic_id: a.clinic_id,
        date: a.date,
        time_slot: a.time_slot,
        status: a.status,
        created_at: a.created_at,
        doctor_name: docUser ? docUser.name : '',
        specialty: docProfile ? docProfile.specialty : '',
        avatar_url: docProfile ? docProfile.avatar_url : '',
        clinic_name: clinic ? clinic.name : ''
      });
    }

    res.json({ profile, appointments: formattedAppointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load patient dashboard' });
  }
}
