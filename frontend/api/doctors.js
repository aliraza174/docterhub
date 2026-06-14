import { connectToDatabase } from '../utils/db';
import { User } from '../models/User';
import { Doctor } from '../models/Doctor';
import { Clinic } from '../models/Clinic';
import { Appointment } from '../models/Appointment';
import { Assistant } from '../models/Assistant';
import { Patient } from '../models/Patient';
import { verifyAuth, setCorsHeaders } from '../utils/auth';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectToDatabase();
  const pathname = req.url.split('?')[0];

  // 1. DOCTOR DASHBOARD (GET /api/doctor/dashboard)
  if (pathname === '/api/doctor/dashboard') {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const user = await verifyAuth(req, res, 'doctor');
    if (!user) return;

    try {
      const doctor = await Doctor.findOne({ id: user.id });
      const appointments = await Appointment.find({ doctor_id: user.id }).sort({ date: -1, time_slot: -1 });

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

      const clinics = await Clinic.find({ doctor_id: user.id });
      const formattedClinics = clinics.map(c => ({
        id: c._id.toString(),
        doctor_id: c.doctor_id,
        name: c.name,
        address: c.address,
        schedule: typeof c.schedule === 'string' ? JSON.parse(c.schedule) : c.schedule
      }));

      const assistantProfile = await Assistant.findOne({ doctor_id: user.id });
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

      return res.json({ doctor, appointments: formattedAppointments, clinics: formattedClinics, assistant });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to load doctor dashboard' });
    }
  }

  // 2. UPDATE CLINIC (PUT /api/doctor/clinics/:id)
  if (pathname.startsWith('/api/doctor/clinics/')) {
    if (req.method !== 'PUT') {
      res.setHeader('Allow', ['PUT']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const user = await verifyAuth(req, res, 'doctor');
    if (!user) return;

    const clinicId = pathname.split('/').pop();
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

      return res.json({ message: 'Clinic details and schedule updated successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Clinic update failed' });
    }
  }

  // 3. GET SINGLE DOCTOR (GET /api/doctors/:id)
  if (pathname.startsWith('/api/doctors/') && pathname !== '/api/doctors') {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const doctorId = pathname.split('/').pop();

    try {
      const doctorProfile = await Doctor.findOne({ id: doctorId });
      const userProfile = await User.findOne({ _id: doctorId, role: 'doctor' });

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

      const clinics = await Clinic.find({ doctor_id: doctorId });
      const formattedClinics = clinics.map(c => ({
        id: c._id.toString(),
        doctor_id: c.doctor_id,
        name: c.name,
        address: c.address,
        schedule: typeof c.schedule === 'string' ? JSON.parse(c.schedule) : c.schedule
      }));

      return res.json({ doctor: doctorData, clinics: formattedClinics });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to retrieve doctor details' });
    }
  }

  // 4. LIST DOCTORS (GET /api/doctors)
  if (pathname === '/api/doctors') {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

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

      return res.json(doctorsList);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to retrieve doctors list' });
    }
  }

  // Fallback
  return res.status(404).json({ error: 'Doctors endpoint not found' });
}
