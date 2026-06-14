import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initDb, getDb } from './db.js';
import { authenticateToken, authorizeRoles, JWT_SECRET } from './middleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '20mb' })); // support large base64 uploads (receipt screenshots)

// Setup database on boot
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

/* ==========================================================================
   AUTHENTICATION APIS
   ========================================================================== */

// Register Route
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, age, gender, blood_group, emergency_contact, specialty, disease_focus, experience, bio, fees } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }

  const db = await getDb();
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await db.run('BEGIN TRANSACTION;');

    // Insert user
    const result = await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      [name, email, passwordHash, role]
    );
    const userId = result.lastID;

    // Insert role-specific profile details
    if (role === 'patient') {
      await db.run(
        `INSERT INTO patients (id, age, gender, blood_group, emergency_contact) VALUES (?, ?, ?, ?, ?)`,
        [userId, age || null, gender || null, blood_group || null, emergency_contact || null]
      );
    } else if (role === 'doctor') {
      if (!specialty || !fees) {
        throw new Error('Specialty and fees are required for doctors');
      }
      await db.run(
        `INSERT INTO doctors (id, specialty, disease_focus, experience, bio, fees, rating, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          specialty,
          disease_focus || '',
          experience || 0,
          bio || '',
          fees,
          5.0,
          'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200'
        ]
      );
      // Automatically create a clinic for the new doctor
      await db.run(
        `INSERT INTO clinics (doctor_id, name, address, schedule) VALUES (?, ?, ?, ?)`,
        [
          userId,
          `${name}'s Health Clinic`,
          'Main Medical Boulevard, Suite A',
          JSON.stringify({
            "Monday": ["09:00 AM", "11:00 AM", "02:00 PM"],
            "Wednesday": ["09:00 AM", "11:00 AM", "02:00 PM"],
            "Friday": ["09:00 AM", "11:00 AM"]
          })
        ]
      );
    } else if (role === 'assistant') {
      // Default to no linked doctor, Admin will link them later
      await db.run(
        `INSERT INTO assistants (id, doctor_id) VALUES (?, ?)`,
        [userId, null]
      );
    }

    await db.run('COMMIT;');
    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error) {
    await db.run('ROLLBACK;');
    console.error(error);
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = await getDb();
  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Forgot Password Route (Mock)
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  const db = await getDb();
  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ error: 'User with this email does not exist' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);

    res.json({ message: 'Password updated successfully! You can now log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Reset password failed' });
  }
});

/* ==========================================================================
   DOCTOR LISTING & FILTERING
   ========================================================================== */

// Get Doctors
app.get('/api/doctors', async (req, res) => {
  const { specialty, disease, search } = req.query;
  const db = await getDb();
  try {
    let query = `
      SELECT u.id, u.name, u.email, d.specialty, d.disease_focus, d.experience, d.bio, d.fees, d.rating, d.avatar_url, c.name as clinic_name, c.address as clinic_address, c.id as clinic_id
      FROM users u
      JOIN doctors d ON u.id = d.id
      LEFT JOIN clinics c ON d.id = c.doctor_id
      WHERE u.role = 'doctor'
    `;
    const params = [];

    if (specialty) {
      query += ` AND d.specialty = ?`;
      params.push(specialty);
    }

    if (disease) {
      query += ` AND d.disease_focus LIKE ?`;
      params.push(`%${disease}%`);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR d.bio LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const doctorsList = await db.all(query, params);
    res.json(doctorsList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve doctors list' });
  }
});

// Get Doctor Clinics & Schedule
app.get('/api/doctors/:id', async (req, res) => {
  const db = await getDb();
  try {
    const doctor = await db.get(
      `SELECT u.name, u.email, d.* FROM users u JOIN doctors d ON u.id = d.id WHERE u.id = ? AND u.role = 'doctor'`,
      [req.params.id]
    );

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const clinics = await db.all('SELECT * FROM clinics WHERE doctor_id = ?', [req.params.id]);
    res.json({ doctor, clinics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve doctor details' });
  }
});

/* ==========================================================================
   APPOINTMENT BOOKING WORKFLOW
   ========================================================================== */

// Patient Books Appointment
app.post('/api/appointments', authenticateToken, authorizeRoles('patient'), async (req, res) => {
  const { doctor_id, clinic_id, date, time_slot } = req.body;
  const patient_id = req.user.id;

  if (!doctor_id || !clinic_id || !date || !time_slot) {
    return res.status(400).json({ error: 'Doctor, clinic, date, and time slot are required' });
  }

  const db = await getDb();
  try {
    // Check if slot already booked for this doctor
    const existing = await db.get(
      `SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time_slot = ? AND status != 'cancelled'`,
      [doctor_id, date, time_slot]
    );

    if (existing) {
      return res.status(400).json({ error: 'This time slot is already booked for this doctor. Please choose another one.' });
    }

    const result = await db.run(
      `INSERT INTO appointments (patient_id, doctor_id, clinic_id, date, time_slot, status) VALUES (?, ?, ?, ?, ?, 'pending_payment')`,
      [patient_id, doctor_id, clinic_id, date, time_slot]
    );

    res.status(201).json({ message: 'Appointment booked! Please upload payment screenshot to confirm.', appointmentId: result.lastID });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Booking failed' });
  }
});

// Patient Uploads Payment Screenshot
app.post('/api/payments', authenticateToken, authorizeRoles('patient'), async (req, res) => {
  const { appointment_id, amount, payment_screenshot } = req.body;

  if (!appointment_id || !amount || !payment_screenshot) {
    return res.status(400).json({ error: 'Appointment ID, amount, and payment screenshot are required' });
  }

  const db = await getDb();
  try {
    const appointment = await db.get('SELECT * FROM appointments WHERE id = ? AND patient_id = ?', [appointment_id, req.user.id]);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or not owned by you' });
    }

    await db.run('BEGIN TRANSACTION;');

    // Insert or update payment
    await db.run(
      `INSERT INTO payments (appointment_id, amount, payment_screenshot, status) 
       VALUES (?, ?, ?, 'pending')
       ON CONFLICT(appointment_id) DO UPDATE SET amount=excluded.amount, payment_screenshot=excluded.payment_screenshot, status='pending'`,
      [appointment_id, amount, payment_screenshot]
    );

    // Update appointment status
    await db.run(
      `UPDATE appointments SET status = 'pending_verification' WHERE id = ?`,
      [appointment_id]
    );

    await db.run('COMMIT;');
    res.json({ message: 'Payment screenshot uploaded successfully. Awaiting verification from medical assistant.' });
  } catch (error) {
    await db.run('ROLLBACK;');
    console.error(error);
    res.status(500).json({ error: 'Failed to process payment upload' });
  }
});

// Assistant reviews payments
app.get('/api/assistant/payments', authenticateToken, authorizeRoles('assistant'), async (req, res) => {
  const db = await getDb();
  try {
    // Get assistant's linked doctor
    const assistant = await db.get('SELECT doctor_id FROM assistants WHERE id = ?', [req.user.id]);
    if (!assistant || !assistant.doctor_id) {
      return res.status(400).json({ error: 'You are not linked to any doctor yet. Ask Admin to assign you.' });
    }

    // Retrieve pending payment verifications for that doctor
    const pending = await db.all(`
      SELECT p.id as payment_id, p.amount, p.payment_screenshot, p.status as payment_status, p.created_at as paid_at,
             a.id as appointment_id, a.date, a.time_slot, a.status as appointment_status,
             up.name as patient_name, up.email as patient_email
      FROM payments p
      JOIN appointments a ON p.appointment_id = a.id
      JOIN users up ON a.patient_id = up.id
      WHERE a.doctor_id = ? AND p.status = 'pending'
    `, [assistant.doctor_id]);

    res.json(pending);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
});

// Assistant verifies payment
app.post('/api/assistant/verify-payment', authenticateToken, authorizeRoles('assistant'), async (req, res) => {
  const { payment_id, status } = req.body; // 'verified' or 'rejected'

  if (!payment_id || !['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Valid payment ID and status (verified/rejected) are required' });
  }

  const db = await getDb();
  try {
    const payment = await db.get('SELECT * FROM payments WHERE id = ?', [payment_id]);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const assistant = await db.get('SELECT doctor_id FROM assistants WHERE id = ?', [req.user.id]);
    const appointment = await db.get('SELECT doctor_id FROM appointments WHERE id = ?', [payment.appointment_id]);

    if (!assistant || assistant.doctor_id !== appointment.doctor_id) {
      return res.status(403).json({ error: 'Unauthorized to verify payments for this doctor' });
    }

    await db.run('BEGIN TRANSACTION;');

    const verifiedAt = new Date().toISOString();
    await db.run(
      `UPDATE payments SET status = ?, verified_by = ?, verified_at = ? WHERE id = ?`,
      [status, req.user.id, verifiedAt, payment_id]
    );

    const appStatus = status === 'verified' ? 'confirmed' : 'cancelled';
    await db.run(
      `UPDATE appointments SET status = ? WHERE id = ?`,
      [appStatus, payment.appointment_id]
    );

    await db.run('COMMIT;');
    res.json({ message: `Payment is successfully ${status}. Appointment is now ${appStatus}.` });
  } catch (error) {
    await db.run('ROLLBACK;');
    console.error(error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/* ==========================================================================
   PRESCRIPTION MANAGEMENT
   ========================================================================== */

// Doctor adds prescription
app.post('/api/prescriptions', authenticateToken, authorizeRoles('doctor'), async (req, res) => {
  const { appointment_id, patient_id, diagnosis, medicines, instructions } = req.body;
  const doctor_id = req.user.id;

  if (!appointment_id || !patient_id || !diagnosis || !medicines) {
    return res.status(400).json({ error: 'Appointment ID, Patient ID, diagnosis, and medicines are required' });
  }

  const db = await getDb();
  try {
    const appointment = await db.get(
      'SELECT id, status FROM appointments WHERE id = ? AND doctor_id = ?',
      [appointment_id, doctor_id]
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or not assigned to you' });
    }

    await db.run('BEGIN TRANSACTION;');

    // Insert prescription
    const presResult = await db.run(
      `INSERT INTO prescriptions (appointment_id, doctor_id, patient_id, diagnosis, medicines, instructions)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [appointment_id, doctor_id, patient_id, diagnosis, JSON.stringify(medicines), instructions || '']
    );
    const prescriptionId = presResult.lastID;

    // Update appointment status to completed
    await db.run(
      `UPDATE appointments SET status = 'completed' WHERE id = ?`,
      [appointment_id]
    );

    // Insert medical history entry (Immutable)
    await db.run(
      `INSERT INTO medical_history (patient_id, doctor_id, record_type, record_id, title, description)
       VALUES (?, ?, 'prescription', ?, ?, ?)`,
      [
        patient_id,
        doctor_id,
        prescriptionId,
        `Prescription for Diagnosis: ${diagnosis}`,
        `Prescribed by Doctor ID: ${doctor_id}. Instructions: ${instructions || 'None'}`
      ]
    );

    await db.run('COMMIT;');
    res.status(201).json({ message: 'Prescription created and added to patient medical history successfully!', prescriptionId });
  } catch (error) {
    await db.run('ROLLBACK;');
    console.error(error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

/* ==========================================================================
   PATIENT MEDICAL HISTORY TIMELINE
   ========================================================================== */

// Get patient medical history (Secure)
app.get('/api/patients/:id/history', authenticateToken, async (req, res) => {
  const patientId = req.params.id;
  const db = await getDb();
  try {
    // SECURITY RBAC: Patients can only view their own history. Doctors, assistants, admins, and super-admins can view it.
    if (req.user.role === 'patient' && String(req.user.id) !== String(patientId)) {
      return res.status(403).json({ error: 'You are unauthorized to view another patient\'s medical history' });
    }

    // Retrieve history timeline
    const history = await db.all(
      `SELECT mh.*, ud.name as doctor_name, pr.diagnosis, pr.medicines, pr.instructions
       FROM medical_history mh
       LEFT JOIN users ud ON mh.doctor_id = ud.id
       LEFT JOIN prescriptions pr ON mh.record_id = pr.id AND mh.record_type = 'prescription'
       WHERE mh.patient_id = ?
       ORDER BY mh.created_at DESC`,
      [patientId]
    );

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch medical history' });
  }
});

// Patient uploads reports/lab results (record_type = 'report' or 'lab_result')
app.post('/api/patients/:id/history/upload', authenticateToken, authorizeRoles('patient'), async (req, res) => {
  const patientId = req.params.id;
  const { title, description, record_type, file_path } = req.body;

  if (String(req.user.id) !== String(patientId)) {
    return res.status(403).json({ error: 'You are unauthorized to upload documents to another patient\'s timeline' });
  }

  if (!title || !record_type || !['report', 'lab_result'].includes(record_type)) {
    return res.status(400).json({ error: 'Title and record type (report or lab_result) are required' });
  }

  const db = await getDb();
  try {
    await db.run(
      `INSERT INTO medical_history (patient_id, doctor_id, record_type, record_id, title, description, file_path)
       VALUES (?, NULL, ?, NULL, ?, ?, ?)`,
      [patientId, record_type, title, description || '', file_path || null]
    );

    res.status(201).json({ message: 'Medical record uploaded to history timeline successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload medical record' });
  }
});

/* ==========================================================================
   ROLE-SPECIFIC PORTAL DATA RETRIEVAL
   ========================================================================== */

// Patient Dashboard Overview
app.get('/api/patient/dashboard', authenticateToken, authorizeRoles('patient'), async (req, res) => {
  const patientId = req.user.id;
  const db = await getDb();
  try {
    const profile = await db.get('SELECT * FROM patients WHERE id = ?', [patientId]);
    const appointments = await db.all(`
      SELECT a.*, ud.name as doctor_name, doc.specialty, doc.avatar_url, c.name as clinic_name
      FROM appointments a
      JOIN users ud ON a.doctor_id = ud.id
      JOIN doctors doc ON ud.id = doc.id
      JOIN clinics c ON a.clinic_id = c.id
      WHERE a.patient_id = ?
      ORDER BY a.date DESC, a.time_slot DESC
    `, [patientId]);

    res.json({ profile, appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load patient dashboard' });
  }
});

// Doctor Dashboard Overview
app.get('/api/doctor/dashboard', authenticateToken, authorizeRoles('doctor'), async (req, res) => {
  const doctorId = req.user.id;
  const db = await getDb();
  try {
    const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', [doctorId]);
    const appointments = await db.all(`
      SELECT a.*, up.name as patient_name, pat.age, pat.gender, pat.blood_group
      FROM appointments a
      JOIN users up ON a.patient_id = up.id
      JOIN patients pat ON up.id = pat.id
      WHERE a.doctor_id = ?
      ORDER BY a.date DESC, a.time_slot DESC
    `, [doctorId]);

    const clinics = await db.all('SELECT * FROM clinics WHERE doctor_id = ?', [doctorId]);
    const assistant = await db.get('SELECT u.name, u.email FROM assistants a JOIN users u ON a.id = u.id WHERE a.doctor_id = ?', [doctorId]);

    res.json({ doctor, appointments, clinics, assistant: assistant || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load doctor dashboard' });
  }
});

// Update Doctor Clinic Schedule
app.put('/api/doctor/clinics/:id', authenticateToken, authorizeRoles('doctor'), async (req, res) => {
  const { schedule, name, address } = req.body;
  const db = await getDb();
  try {
    const clinic = await db.get('SELECT doctor_id FROM clinics WHERE id = ?', [req.params.id]);
    if (!clinic || clinic.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized clinic modification' });
    }

    await db.run(
      `UPDATE clinics SET name = ?, address = ?, schedule = ? WHERE id = ?`,
      [name, address, JSON.stringify(schedule), req.params.id]
    );

    res.json({ message: 'Clinic details and schedule updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Clinic update failed' });
  }
});

/* ==========================================================================
   ADMIN & SUPER ADMIN MANAGEMENT
   ========================================================================== */

// System Analytics
app.get('/api/admin/stats', authenticateToken, authorizeRoles('admin', 'super_admin'), async (req, res) => {
  const db = await getDb();
  try {
    const totalRevenue = await db.get(`SELECT SUM(amount) as sum FROM payments WHERE status = 'verified'`);
    const doctorCount = await db.get(`SELECT COUNT(*) as count FROM doctors`);
    const patientCount = await db.get(`SELECT COUNT(*) as count FROM patients`);
    const appointmentCount = await db.get(`SELECT COUNT(*) as count FROM appointments`);

    const monthlyRevenue = [
      { month: 'Jan', revenue: 420 },
      { month: 'Feb', revenue: 680 },
      { month: 'Mar', revenue: 950 },
      { month: 'Apr', revenue: 1400 },
      { month: 'May', revenue: 1200 },
      { month: 'Jun', revenue: totalRevenue.sum || 320 }
    ];

    res.json({
      revenue: totalRevenue.sum || 0,
      doctors: doctorCount.count,
      patients: patientCount.count,
      appointments: appointmentCount.count,
      monthlyRevenue
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
});

// List Users
app.get('/api/admin/users', authenticateToken, authorizeRoles('admin', 'super_admin'), async (req, res) => {
  const db = await getDb();
  try {
    const users = await db.all('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Update User Role (Super Admin Only)
app.put('/api/admin/users/:id/role', authenticateToken, authorizeRoles('super_admin'), async (req, res) => {
  const { role } = req.body;
  if (!['patient', 'doctor', 'assistant', 'admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const db = await getDb();
  try {
    await db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: 'User role updated successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Assign Assistant to Doctor
app.post('/api/admin/assistants/assign', authenticateToken, authorizeRoles('admin', 'super_admin'), async (req, res) => {
  const { assistant_id, doctor_id } = req.body;
  if (!assistant_id || !doctor_id) {
    return res.status(400).json({ error: 'Assistant ID and Doctor ID are required' });
  }

  const db = await getDb();
  try {
    await db.run('UPDATE assistants SET doctor_id = ? WHERE id = ?', [doctor_id, assistant_id]);
    res.json({ message: 'Assistant successfully assigned to doctor!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to assign assistant' });
  }
});

/* ==========================================================================
   IMMUTABILITY RULES (SECURITY)
   ========================================================================== */

// Catch-all block on DELETE and UPDATE of prescriptions/history
app.delete('/api/prescriptions*', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed: Prescriptions cannot be deleted.' });
});
app.put('/api/prescriptions*', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed: Past prescriptions cannot be edited.' });
});
app.delete('/api/patients/:id/history*', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed: Patient medical history logs cannot be deleted.' });
});
app.put('/api/patients/:id/history*', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed: Historical medical logs cannot be updated.' });
});
