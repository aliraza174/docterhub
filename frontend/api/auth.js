import { connectToDatabase } from '../utils/db';
import { User } from '../models/User';
import { Patient } from '../models/Patient';
import { Doctor } from '../models/Doctor';
import { Assistant } from '../models/Assistant';
import { Clinic } from '../models/Clinic';
import { setCorsHeaders, JWT_SECRET } from '../utils/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectToDatabase();
    const pathname = req.url.split('?')[0];
    const action = req.query.action || pathname.split('/').pop();

    // 1. REGISTER
    if (action === 'register') {
      if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
      }

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

        const newUser = new User({
          name,
          email,
          password_hash: passwordHash,
          role
        });
        const savedUser = await newUser.save();
        const userId = savedUser._id.toString();

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

        return res.status(201).json({ message: 'User registered successfully', userId });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message || 'Registration failed' });
      }
    }

    // 2. LOGIN
    if (action === 'login') {
      if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
      }

      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      try {
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
          { id: user._id.toString(), email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.json({
          token,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Login failed' });
      }
    }

    // 3. FORGOT PASSWORD
    if (action === 'forgot-password') {
      if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
      }

      const { email, newPassword } = req.body;
      if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and new password are required' });
      }

      try {
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(404).json({ error: 'User with this email does not exist' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        
        user.password_hash = passwordHash;
        await user.save();

        return res.json({ message: 'Password updated successfully! You can now log in.' });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Reset password failed' });
      }
    }

    // Fallback
    return res.status(404).json({ error: 'Auth endpoint not found' });
  } catch (error) {
    console.error('API Error in auth handler:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
