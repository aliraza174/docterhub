import { connectToDatabase } from './utils/db';
import { Appointment } from './models/Appointment';
import { Patient } from './models/Patient';
import { User } from './models/User';
import { Doctor } from './models/Doctor';
import { Clinic } from './models/Clinic';
import { MedicalHistory } from './models/MedicalHistory';
import { Prescription } from './models/Prescription';
import { verifyAuth, setCorsHeaders } from './utils/auth';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectToDatabase();
  const pathname = req.url.split('?')[0];

  // 1. PATIENT DASHBOARD SUMMARY (GET /api/patient/dashboard)
  if (pathname === '/api/patient/dashboard') {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const user = await verifyAuth(req, res, 'patient');
    if (!user) return;

    try {
      const profile = await Patient.findOne({ id: user.id });
      const appointments = await Appointment.find({ patient_id: user.id }).sort({ date: -1, time_slot: -1 });

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

      return res.json({ profile, appointments: formattedAppointments });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to load patient dashboard' });
    }
  }

  // 2. PATIENT HISTORY TIMELINE (GET /api/patients/:id/history)
  if (pathname.startsWith('/api/patients/') && pathname.endsWith('/history')) {
    // IMMUTABILITY SECURITY RULES: Block DELETE and PUT requests
    if (req.method === 'DELETE' || req.method === 'PUT') {
      const errorMsg = req.method === 'DELETE' 
        ? 'Method Not Allowed: Patient medical history logs cannot be deleted.' 
        : 'Method Not Allowed: Historical medical logs cannot be updated.';
      return res.status(405).json({ error: errorMsg });
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const user = await verifyAuth(req, res);
    if (!user) return;

    const parts = pathname.split('/');
    const patientId = parts[3]; // parts is ['', 'api', 'patients', ':id', 'history']

    if (user.role === 'patient' && String(user.id) !== String(patientId)) {
      return res.status(403).json({ error: 'You are unauthorized to view another patient\'s medical history' });
    }

    try {
      const history = await MedicalHistory.find({ patient_id: patientId }).sort({ created_at: -1 });
      const formattedHistory = [];

      for (const mh of history) {
        let doctorName = '';
        if (mh.doctor_id) {
          const docUser = await User.findById(mh.doctor_id);
          if (docUser) doctorName = docUser.name;
        }

        let prescriptionDetails = null;
        if (mh.record_type === 'prescription' && mh.record_id) {
          const pres = await Prescription.findById(mh.record_id);
          if (pres) {
            prescriptionDetails = {
              diagnosis: pres.diagnosis,
              medicines: pres.medicines,
              instructions: pres.instructions
            };
          }
        }

        formattedHistory.push({
          id: mh._id.toString(),
          patient_id: mh.patient_id,
          doctor_id: mh.doctor_id,
          record_type: mh.record_type,
          record_id: mh.record_id,
          title: mh.title,
          description: mh.description,
          file_path: mh.file_path,
          created_at: mh.created_at,
          doctor_name: doctorName,
          diagnosis: prescriptionDetails ? prescriptionDetails.diagnosis : undefined,
          medicines: prescriptionDetails ? prescriptionDetails.medicines : undefined,
          instructions: prescriptionDetails ? prescriptionDetails.instructions : undefined
        });
      }

      return res.json(formattedHistory);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch medical history' });
    }
  }

  // 3. UPLOAD REPORT TIMELINE (POST /api/patients/:id/history/upload)
  if (pathname.startsWith('/api/patients/') && pathname.endsWith('/history/upload')) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const user = await verifyAuth(req, res, 'patient');
    if (!user) return;

    const parts = pathname.split('/');
    const patientId = parts[3];
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
      return res.status(201).json({ message: 'Medical record uploaded to history timeline successfully.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to upload medical record' });
    }
  }

  // 4. BOOK APPOINTMENT (POST /api/appointments)
  if (pathname === '/api/appointments') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const user = await verifyAuth(req, res, 'patient');
    if (!user) return;

    const { doctor_id, clinic_id, date, time_slot } = req.body;
    const patient_id = user.id;

    if (!doctor_id || !clinic_id || !date || !time_slot) {
      return res.status(400).json({ error: 'Doctor, clinic, date, and time slot are required' });
    }

    try {
      const existing = await Appointment.findOne({
        doctor_id,
        date,
        time_slot,
        status: { $ne: 'cancelled' }
      });

      if (existing) {
        return res.status(400).json({ error: 'This time slot is already booked for this doctor. Please choose another one.' });
      }

      const newAppointment = new Appointment({
        patient_id,
        doctor_id,
        clinic_id,
        date,
        time_slot,
        status: 'pending_payment'
      });

      const saved = await newAppointment.save();
      return res.status(201).json({
        message: 'Appointment booked! Please upload payment screenshot to confirm.',
        appointmentId: saved._id.toString()
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Booking failed' });
    }
  }

  // Fallback
  return res.status(404).json({ error: 'Appointments endpoint not found' });
}
