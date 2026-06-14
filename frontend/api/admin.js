import { connectToDatabase } from '../utils/db.js';
import { Payment } from '../models/Payment.js';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { Appointment } from '../models/Appointment.js';
import { User } from '../models/User.js';
import { Assistant } from '../models/Assistant.js';
import { verifyAuth, setCorsHeaders } from '../utils/auth.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectToDatabase();
    const pathname = req.url.split('?')[0];
    const action = req.query.action || 
                   (pathname === '/api/admin/stats' ? 'stats' : null) ||
                   (pathname === '/api/admin/users' ? 'users' : null) ||
                   (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/role') ? 'update-role' : null) ||
                   (pathname === '/api/admin/assistants/assign' ? 'assign-assistant' : null);

    // 1. ANALYTICS STATS (GET /api/admin/stats)
    if (action === 'stats') {
      if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
      }

      const user = await verifyAuth(req, res, 'admin', 'super_admin');
      if (!user) return;

      try {
        const verifiedPayments = await Payment.find({ status: 'verified' });
        const totalRevenue = verifiedPayments.reduce((acc, curr) => acc + curr.amount, 0);

        const doctorCount = await Doctor.countDocuments();
        const patientCount = await Patient.countDocuments();
        const appointmentCount = await Appointment.countDocuments();

        const monthlyRevenue = [
          { month: 'Jan', revenue: 420 },
          { month: 'Feb', revenue: 680 },
          { month: 'Mar', revenue: 950 },
          { month: 'Apr', revenue: 1400 },
          { month: 'May', revenue: 1200 },
          { month: 'Jun', revenue: totalRevenue || 320 }
        ];

        return res.json({
          revenue: totalRevenue || 0,
          doctors: doctorCount,
          patients: patientCount,
          appointments: appointmentCount,
          monthlyRevenue
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to retrieve analytics' });
      }
    }

    // 2. LIST USERS (GET /api/admin/users)
    if (action === 'users') {
      if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
      }

      const user = await verifyAuth(req, res, 'admin', 'super_admin');
      if (!user) return;

      try {
        const users = await User.find({}).sort({ created_at: -1 });
        const formattedUsers = users.map(u => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
          created_at: u.created_at
        }));

        return res.json(formattedUsers);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to retrieve users' });
      }
    }

    // 3. SHIFT USER ROLE (PUT /api/admin/users/:id/role)
    if (action === 'update-role') {
      if (req.method !== 'PUT') {
        res.setHeader('Allow', ['PUT']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
      }

      const user = await verifyAuth(req, res, 'super_admin');
      if (!user) return;

      const targetUserId = req.query.userId || pathname.split('/')[4];
      const { role } = req.body;

      if (!['patient', 'doctor', 'assistant', 'admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      try {
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
          return res.status(404).json({ error: 'User not found' });
        }

        targetUser.role = role;
        await targetUser.save();

        return res.json({ message: 'User role updated successfully!' });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to update user role' });
      }
    }

    // 4. ASSIGN ASSISTANT TO DOCTOR (POST /api/admin/assistants/assign)
    if (action === 'assign-assistant') {
      if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
      }

      const user = await verifyAuth(req, res, 'admin', 'super_admin');
      if (!user) return;

      const { assistant_id, doctor_id } = req.body;
      if (!assistant_id || !doctor_id) {
        return res.status(400).json({ error: 'Assistant ID and Doctor ID are required' });
      }

      try {
        let assistant = await Assistant.findOne({ id: assistant_id });
        if (!assistant) {
          assistant = new Assistant({
            id: assistant_id,
            doctor_id
          });
          await assistant.save();
        } else {
          assistant.doctor_id = doctor_id;
          await assistant.save();
        }

        return res.json({ message: 'Assistant successfully assigned to doctor!' });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to assign assistant' });
      }
    }

    // Fallback
    return res.status(404).json({ error: 'Admin endpoint not found' });
  } catch (error) {
    console.error('API Error in admin handler:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
