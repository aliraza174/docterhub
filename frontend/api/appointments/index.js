import { connectToDatabase } from '../utils/db';
import { Appointment } from '../models/Appointment';
import { verifyAuth, setCorsHeaders } from '../utils/auth';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectToDatabase();
  const user = await verifyAuth(req, res, 'patient');
  if (!user) return; // verifyAuth handles error response

  const { doctor_id, clinic_id, date, time_slot } = req.body;
  const patient_id = user.id;

  if (!doctor_id || !clinic_id || !date || !time_slot) {
    return res.status(400).json({ error: 'Doctor, clinic, date, and time slot are required' });
  }

  try {
    // Check if slot already booked for this doctor (excluding cancelled appointments)
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
    res.status(201).json({
      message: 'Appointment booked! Please upload payment screenshot to confirm.',
      appointmentId: saved._id.toString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Booking failed' });
  }
}
