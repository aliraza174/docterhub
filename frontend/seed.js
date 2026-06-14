import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: Please set the MONGODB_URI environment variable before running the seed script.');
  process.exit(1);
}

// Inline model definitions to run independent of path issues in local shell env
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'assistant', 'admin', 'super_admin'], required: true },
  created_at: { type: Date, default: Date.now }
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const PatientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  age: { type: Number, default: null },
  gender: { type: String, default: null },
  blood_group: { type: String, default: null },
  emergency_contact: { type: String, default: null }
});
const Patient = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);

const DoctorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  specialty: { type: String, enum: ['Allopathic', 'Homeopathic', 'Herbal'], required: true },
  disease_focus: { type: String, default: '' },
  experience: { type: Number, default: 0 },
  bio: { type: String, default: '' },
  fees: { type: Number, required: true },
  rating: { type: Number, default: 5.0 },
  avatar_url: { type: String, default: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200' }
});
const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);

const AssistantSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  doctor_id: { type: String, default: null }
});
const Assistant = mongoose.models.Assistant || mongoose.model('Assistant', AssistantSchema);

const ClinicSchema = new mongoose.Schema({
  doctor_id: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  schedule: { type: mongoose.Schema.Types.Mixed, default: {} }
});
const Clinic = mongoose.models.Clinic || mongoose.model('Clinic', ClinicSchema);

async function seed() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI, { dbName: 'doctorhub' });
  console.log('Connected! Cleaning existing collections...');

  await User.deleteMany({});
  await Patient.deleteMany({});
  await Doctor.deleteMany({});
  await Assistant.deleteMany({});
  await Clinic.deleteMany({});

  console.log('Collections cleared. Hashing default passwords...');
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('password123', salt);

  // 1. Super Admin
  const superAdmin = new User({
    name: 'Super Admin',
    email: 'superadmin@doctorhub.com',
    password_hash: defaultPasswordHash,
    role: 'super_admin'
  });
  await superAdmin.save();

  // 2. Admin
  const admin = new User({
    name: 'Admin Hub',
    email: 'admin@doctorhub.com',
    password_hash: defaultPasswordHash,
    role: 'admin'
  });
  await admin.save();

  // 3. Doctors & their User Accounts
  // Dr. Sarah Jenkins (Allopathic, cardiologist)
  const d1 = new User({
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@doctorhub.com',
    password_hash: defaultPasswordHash,
    role: 'doctor'
  });
  await d1.save();
  const doc1Profile = new Doctor({
    id: d1._id.toString(),
    specialty: 'Allopathic',
    disease_focus: 'Heart disease, High blood pressure, Chest pain, Arrhythmia, Flu',
    experience: 14,
    bio: 'Senior Cardiologist with extensive research in minimally invasive cardiac procedures and preventive care.',
    fees: 150.0,
    rating: 4.9,
    avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'
  });
  await doc1Profile.save();

  // Dr. Albert Hahn (Homeopathic)
  const d2 = new User({
    name: 'Dr. Albert Hahn',
    email: 'albert.hahn@doctorhub.com',
    password_hash: defaultPasswordHash,
    role: 'doctor'
  });
  await d2.save();
  const doc2Profile = new Doctor({
    id: d2._id.toString(),
    specialty: 'Homeopathic',
    disease_focus: 'Eczema, Asthma, Chronic fatigue, Arthritis, Migraine',
    experience: 10,
    bio: 'Dedicated Homeopathic Practitioner focusing on holistic remedies and customized treatment plans.',
    fees: 80.0,
    rating: 4.8,
    avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'
  });
  await doc2Profile.save();

  // Dr. Mei Ling (Herbal)
  const d3 = new User({
    name: 'Dr. Mei Ling',
    email: 'mei.ling@doctorhub.com',
    password_hash: defaultPasswordHash,
    role: 'doctor'
  });
  await d3.save();
  const doc3Profile = new Doctor({
    id: d3._id.toString(),
    specialty: 'Herbal',
    disease_focus: 'Anxiety, Insomnia, Indigestion, Skin inflammation, Stress',
    experience: 12,
    bio: 'Traditional Chinese Medicine and Herbal specialist with a focus on herbal teas, dietary balance, and mental health.',
    fees: 90.0,
    rating: 4.7,
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
  });
  await doc3Profile.save();

  // 4. Assistants & link to doctors
  // Alex Carter (Sarah's Assistant)
  const a1 = new User({
    name: 'Alex Carter',
    email: 'alex.carter@doctorhub.com',
    password_hash: defaultPasswordHash,
    role: 'assistant'
  });
  await a1.save();
  const assistant1Profile = new Assistant({
    id: a1._id.toString(),
    doctor_id: d1._id.toString()
  });
  await assistant1Profile.save();

  // Emma Watson (Albert's Assistant)
  const a2 = new User({
    name: 'Emma Watson',
    email: 'emma.watson@doctorhub.com',
    password_hash: defaultPasswordHash,
    role: 'assistant'
  });
  await a2.save();
  const assistant2Profile = new Assistant({
    id: a2._id.toString(),
    doctor_id: d2._id.toString()
  });
  await assistant2Profile.save();

  // 5. Patient
  const p1 = new User({
    name: 'John Doe',
    email: 'patient@doctorhub.com',
    password_hash: defaultPasswordHash,
    role: 'patient'
  });
  await p1.save();
  const patientProfile = new Patient({
    id: p1._id.toString(),
    age: 28,
    gender: 'Male',
    blood_group: 'O-Positive',
    emergency_contact: '+1-555-0199'
  });
  await patientProfile.save();

  // 6. Clinics and Schedules
  const clinicSchedule = {
    "Monday": ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM"],
    "Wednesday": ["02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
    "Friday": ["09:00 AM", "10:00 AM", "11:00 AM"]
  };

  const c1 = new Clinic({
    doctor_id: d1._id.toString(),
    name: 'Sarah Jenkins Cardiology & General Care',
    address: 'Suite 404, Med Center East, NY',
    schedule: clinicSchedule
  });
  await c1.save();

  const c2 = new Clinic({
    doctor_id: d2._id.toString(),
    name: 'Hahn Homeopathic Clinic',
    address: '12 Healing Way, Boston',
    schedule: clinicSchedule
  });
  await c2.save();

  const c3 = new Clinic({
    doctor_id: d3._id.toString(),
    name: 'Eastern Herbs Wellness Space',
    address: '78 Harmony Lane, SF',
    schedule: clinicSchedule
  });
  await c3.save();

  console.log('Database seeded successfully with dynamic MongoDB ObjectIds!');
  mongoose.connection.close();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  mongoose.connection.close();
});
