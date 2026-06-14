import { connectToDatabase } from '../utils/db';
import { Doctor } from '../models/Doctor';
import { Appointment } from '../models/Appointment';
import { Clinic } from '../models/Clinic';
import { Assistant } from '../models/Assistant';
import { User } from '../models/User';
import { Patient } from '../models/Patient';
import { verifyAuth, setCorsHeaders } from '../utils/auth';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectToDatabase();
  const user = await verifyAuth(req, res, 'doctor');
  if (!user) return;

  const doctorId = user.id;

  try {
    const doctor = await Doctor.findOne({ id: doctorId });
    const appointments = await Appointment.find({ doctor_id: doctorId }).sort({ date: -1, time_slot: -1 });

    const formattedAppointments = [];
    for (const a of appointments) {
      const patientUser = await User.findById(a.patient_id);
      const patientProfile = await Patient.findOne({ id: a.patient_id });

      formattedAppointments.push({
        id: a._id.toString(),
        patient_id: a.patient_id,
        doctor_id: a.doctor_id,
        clinic_id: a.clinic_id,
        date: a.date,
        time_slot: a.time_slot,
        status: a.status,
        created_at: a.created_at,
        patient_name: patientUser ? patientUser.name : '',
        age: patientProfile ? patientProfile.age : null,
        gender: patientProfile ? patientProfile.gender : null,
        blood_group: patientProfile ? patientProfile.blood_group : null
      });
    }

    const clinics = await Clinic.find({ doctor_id: doctorId });
    const formattedClinics = clinics.map(c => ({
      id: c._id.toString(),
      doctor_id: c.doctor_id,
      name: c.name,
      address: c.address,
      schedule: typeof c.schedule === 'string' ? JSON.parse(c.schedule) : c.schedule
    }));

    const assistantProfile = await Assistant.findOne({ doctor_id: doctorId });
    let assistant = null;
    if (assistantProfile) {
      const assistantUser = await User.findById(assistantProfile.id);
      if (assistantUser) {
        assistant = {
          name: assistantUser.name,
          email: assistantUser.email
        };
      }
    }

    res.json({ doctor, appointments: formattedAppointments, clinics: formattedClinics, assistant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load doctor dashboard' });
  }
}
