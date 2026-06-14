import { connectToDatabase } from '../utils/db.js';
import { Appointment } from '../models/Appointment.js';
import { Prescription } from '../models/Prescription.js';
import { MedicalHistory } from '../models/MedicalHistory.js';
import { verifyAuth, setCorsHeaders } from '../utils/auth.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // IMMUTABILITY SECURITY RULES: Block DELETE and PUT requests
    if (req.method === 'DELETE' || req.method === 'PUT') {
      const errorMsg = req.method === 'DELETE' 
        ? 'Method Not Allowed: Prescriptions cannot be deleted.' 
        : 'Method Not Allowed: Past prescriptions cannot be edited.';
      return res.status(405).json({ error: errorMsg });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    await connectToDatabase();
    const user = await verifyAuth(req, res, 'doctor');
    if (!user) return;

    const { appointment_id, patient_id, diagnosis, medicines, instructions } = req.body;
    const doctor_id = user.id;

    if (!appointment_id || !patient_id || !diagnosis || !medicines) {
      return res.status(400).json({ error: 'Appointment ID, Patient ID, diagnosis, and medicines are required' });
    }

    try {
      const appointment = await Appointment.findOne({ _id: appointment_id, doctor_id });
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found or not assigned to you' });
      }

      const newPrescription = new Prescription({
        appointment_id,
        doctor_id,
        patient_id,
        diagnosis,
        medicines,
        instructions: instructions || ''
      });
      const savedPres = await newPrescription.save();
      const prescriptionId = savedPres._id.toString();

      appointment.status = 'completed';
      await appointment.save();

      const historyEntry = new MedicalHistory({
        patient_id,
        doctor_id,
        record_type: 'prescription',
        record_id: prescriptionId,
        title: `Prescription for Diagnosis: ${diagnosis}`,
        description: `Prescribed by Doctor. Instructions: ${instructions || 'None'}`
      });
      await historyEntry.save();

      res.status(201).json({
        message: 'Prescription created and added to patient medical history successfully!',
        prescriptionId
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create prescription' });
    }
  } catch (error) {
    console.error('API Error in prescriptions handler:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
