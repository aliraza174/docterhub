import { connectToDatabase } from '../utils/db';
import { User } from '../models/User';
import { Patient } from '../models/Patient';
import { Doctor } from '../models/Doctor';
import { Assistant } from '../models/Assistant';
import { Clinic } from '../models/Clinic';
import { setCorsHeaders } from '../utils/auth';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectToDatabase();
  const { name, email, password, role, age, gender, blood_group, emergency_contact, specialty, disease_focus, experience, bio, fees } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      name,
      email,
      password_hash: passwordHash,
      role
    });
    const savedUser = await newUser.save();
    const userId = savedUser._id.toString();

    // Create role profile
    if (role === 'patient') {
      const patientProfile = new Patient({
        id: userId,
        age: age || null,
        gender: gender || null,
        blood_group: blood_group || null,
        emergency_contact: emergency_contact || null
      });
      await patientProfile.save();
    } else if (role === 'doctor') {
      if (!specialty || !fees) {
        throw new Error('Specialty and fees are required for doctors');
      }
      const doctorProfile = new Doctor({
        id: userId,
        specialty,
        disease_focus: disease_focus || '',
        experience: experience || 0,
        bio: bio || '',
        fees
      });
      await doctorProfile.save();

      // Clinic creation
      const doctorClinic = new Clinic({
        doctor_id: userId,
        name: `${name}'s Health Clinic`,
        address: 'Main Medical Boulevard, Suite A',
        schedule: {
          "Monday": ["09:00 AM", "11:00 AM", "02:00 PM"],
          "Wednesday": ["09:00 AM", "11:00 AM", "02:00 PM"],
          "Friday": ["09:00 AM", "11:00 AM"]
        }
      });
      await doctorClinic.save();
    } else if (role === 'assistant') {
      const assistantProfile = new Assistant({
        id: userId,
        doctor_id: null
      });
      await assistantProfile.save();
    }

    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
}
