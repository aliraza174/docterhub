import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');
let dbInstance = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  // Ensure parent directory of database exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign key constraints
  await dbInstance.run('PRAGMA foreign_keys = ON;');
  return dbInstance;
}

export async function initDb() {
  const db = await getDb();

  console.log('Initializing database tables...');

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('patient', 'doctor', 'assistant', 'admin', 'super_admin')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      age INTEGER,
      gender TEXT,
      blood_group TEXT,
      emergency_contact TEXT
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      specialty TEXT CHECK(specialty IN ('Allopathic', 'Homeopathic', 'Herbal')) NOT NULL,
      disease_focus TEXT, -- comma-separated tags
      experience INTEGER,
      bio TEXT,
      fees REAL NOT NULL,
      rating REAL DEFAULT 5.0,
      avatar_url TEXT
    );

    CREATE TABLE IF NOT EXISTS assistants (
      id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS clinics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      schedule TEXT -- JSON string
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
      clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending_payment', 'pending_verification', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending_payment',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      payment_screenshot TEXT, -- Base64
      status TEXT CHECK(status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
      verified_by INTEGER REFERENCES assistants(id) ON DELETE SET NULL,
      verified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
      doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
      patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      diagnosis TEXT NOT NULL,
      medicines TEXT NOT NULL, -- JSON list of objects
      instructions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medical_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
      record_type TEXT CHECK(record_type IN ('prescription', 'report', 'lab_result')) NOT NULL,
      record_id INTEGER, -- references prescriptions.id if prescription
      title TEXT NOT NULL,
      description TEXT,
      file_path TEXT, -- Base64 attachment
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default data if empty
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    console.log('Seeding initial database data...');
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', salt);

    // 1. Super Admin
    await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Super Admin', 'superadmin@doctorhub.com', defaultPasswordHash, 'super_admin']
    );

    // 2. Admin
    await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Admin Hub', 'admin@doctorhub.com', defaultPasswordHash, 'admin']
    );

    // 3. Doctors & their user accounts
    // Dr. Sarah Jenkins (Allopathic, cardiologist)
    const d1Result = await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Dr. Sarah Jenkins', 'sarah.jenkins@doctorhub.com', defaultPasswordHash, 'doctor']
    );
    const d1Id = d1Result.lastID;
    await db.run(
      `INSERT INTO doctors (id, specialty, disease_focus, experience, bio, fees, rating, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d1Id,
        'Allopathic',
        'Heart disease, High blood pressure, Chest pain, Arrhythmia, Flu',
        14,
        'Senior Cardiologist with extensive research in minimally invasive cardiac procedures and preventive care.',
        150.0,
        4.9,
        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'
      ]
    );

    // Dr. Albert Hahn (Homeopathic)
    const d2Result = await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Dr. Albert Hahn', 'albert.hahn@doctorhub.com', defaultPasswordHash, 'doctor']
    );
    const d2Id = d2Result.lastID;
    await db.run(
      `INSERT INTO doctors (id, specialty, disease_focus, experience, bio, fees, rating, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d2Id,
        'Homeopathic',
        'Eczema, Asthma, Chronic fatigue, Arthritis, Migraine',
        10,
        'Dedicated Homeopathic Practitioner focusing on holistic remedies and customized constitutional treatment plans.',
        80.0,
        4.8,
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'
      ]
    );

    // Dr. Mei Ling (Herbal)
    const d3Result = await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Dr. Mei Ling', 'mei.ling@doctorhub.com', defaultPasswordHash, 'doctor']
    );
    const d3Id = d3Result.lastID;
    await db.run(
      `INSERT INTO doctors (id, specialty, disease_focus, experience, bio, fees, rating, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d3Id,
        'Herbal',
        'Anxiety, Insomnia, Indigestion, Skin inflammation, Stress',
        12,
        'Traditional Chinese Medicine and Herbal specialist with a focus on herbal teas, dietary balance, and mental health.',
        90.0,
        4.7,
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
      ]
    );

    // Dr. Ethan Hunt (Allopathic)
    const d4Result = await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Dr. Ethan Hunt', 'ethan.hunt@doctorhub.com', defaultPasswordHash, 'doctor']
    );
    const d4Id = d4Result.lastID;
    await db.run(
      `INSERT INTO doctors (id, specialty, disease_focus, experience, bio, fees, rating, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d4Id,
        'Allopathic',
        'Back pain, Spine injuries, Joint arthritis, Fractures, Knee pain',
        8,
        'Orthopedic specialist dedicated to restoring mobility, recovering from sports injuries, and managing joint health.',
        130.0,
        4.8,
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'
      ]
    );

    // Dr. Jane Foster (Allopathic)
    const d5Result = await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Dr. Jane Foster', 'jane.foster@doctorhub.com', defaultPasswordHash, 'doctor']
    );
    const d5Id = d5Result.lastID;
    await db.run(
      `INSERT INTO doctors (id, specialty, disease_focus, experience, bio, fees, rating, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d5Id,
        'Allopathic',
        'Migraine, Epilepsy, Neuropathy, Concussion, Headache, Stress',
        11,
        'Clinical Neurology specialist focusing on chronic migraine management, cognitive therapies, and advanced neurological diagnosis.',
        170.0,
        4.9,
        'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200'
      ]
    );

    // Dr. Samuel Hahnemann (Homeopathic)
    const d6Result = await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Dr. Samuel Hahnemann', 'samuel.hahn@doctorhub.com', defaultPasswordHash, 'doctor']
    );
    const d6Id = d6Result.lastID;
    await db.run(
      `INSERT INTO doctors (id, specialty, disease_focus, experience, bio, fees, rating, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d6Id,
        'Homeopathic',
        'Eczema, Chronic fatigue, Asthma, Chronic sinusitis, Anxiety, Arthritis',
        20,
        'Experienced Homeopath advocating constitutional medicine, customized remedies, and holistic treatment for chronic cases.',
        110.0,
        4.9,
        'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200'
      ]
    );

    // Dr. Clara Barton (Homeopathic)
    const d7Result = await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Dr. Clara Barton', 'clara.barton@doctorhub.com', defaultPasswordHash, 'doctor']
    );
    const d7Id = d7Result.lastID;
    await db.run(
      `INSERT INTO doctors (id, specialty, disease_focus, experience, bio, fees, rating, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d7Id,
        'Homeopathic',
        'Asthma, Food allergies, Eczema, Pediatric immunity, Stress, Insomnia',
        9,
        'Constitutional Homeopath specializing in pediatric allergies, digestive sensitivities, and childhood immunity therapies.',
        75.0,
        4.8,
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
      ]
    );

    // Dr. Li Shizhen (Herbal)
    const d8Result = await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Dr. Li Shizhen', 'li.shizhen@doctorhub.com', defaultPasswordHash, 'doctor']
    );
    const d8Id = d8Result.lastID;
    await db.run(
      `INSERT INTO doctors (id, specialty, disease_focus, experience, bio, fees, rating, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d8Id,
        'Herbal',
        'Acid reflux, Indigestion, IBS, Chronic gastritis, Bloating, Anxiety',
        16,
        'Gastrointestinal Herbalist focusing on gut health, prebiotic botanical diets, and ancient Chinese gastro-remedies.',
        100.0,
        4.9,
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'
      ]
    );

    // Dr. Rosemary Gladstar (Herbal)
    const d9Result = await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Dr. Rosemary Gladstar', 'rosemary.g@doctorhub.com', defaultPasswordHash, 'doctor']
    );
    const d9Id = d9Result.lastID;
    await db.run(
      `INSERT INTO doctors (id, specialty, disease_focus, experience, bio, fees, rating, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d9Id,
        'Herbal',
        'Insomnia, Anxiety, High stress, Tension headache, Chronic fatigue, Skin inflammation',
        15,
        'Folk herbalist and author focusing on nervous system adaptogens, stress mitigation teas, and holistic sleep hygiene.',
        85.0,
        4.8,
        'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200'
      ]
    );

    // 4. Assistants & link to doctors
    // Alex Carter (Sarah's Assistant)
    const a1Result = await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Alex Carter', 'alex.carter@doctorhub.com', defaultPasswordHash, 'assistant']
    );
    const a1Id = a1Result.lastID;
    await db.run(
      `INSERT INTO assistants (id, doctor_id) VALUES (?, ?)`,
      [a1Id, d1Id]
    );

    // Emma Watson (Albert's Assistant)
    const a2Result = await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Emma Watson', 'emma.watson@doctorhub.com', defaultPasswordHash, 'assistant']
    );
    const a2Id = a2Result.lastID;
    await db.run(
      `INSERT INTO assistants (id, doctor_id) VALUES (?, ?)`,
      [a2Id, d2Id]
    );

    // 5. Patient
    const p1Result = await db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['John Doe', 'patient@doctorhub.com', defaultPasswordHash, 'patient']
    );
    const p1Id = p1Result.lastID;
    await db.run(
      `INSERT INTO patients (id, age, gender, blood_group, emergency_contact) VALUES (?, ?, ?, ?, ?)`,
      [p1Id, 28, 'Male', 'O-Positive', '+1-555-0199']
    );

    // 6. Clinics and Schedules
    const clinicSchedule = JSON.stringify({
      "Monday": ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM"],
      "Wednesday": ["02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
      "Friday": ["09:00 AM", "10:00 AM", "11:00 AM"]
    });

    await db.run(
      `INSERT INTO clinics (doctor_id, name, address, schedule) VALUES (?, ?, ?, ?)`,
      [d1Id, 'Sarah Jenkins Cardiology & General Care', 'Suite 404, Med Center East, NY', clinicSchedule]
    );
    await db.run(
      `INSERT INTO clinics (doctor_id, name, address, schedule) VALUES (?, ?, ?, ?)`,
      [d2Id, 'Hahn Homeopathic Clinic', '12 Healing Way, Boston', clinicSchedule]
    );
    await db.run(
      `INSERT INTO clinics (doctor_id, name, address, schedule) VALUES (?, ?, ?, ?)`,
      [d3Id, 'Eastern Herbs Wellness Space', '78 Harmony Lane, SF', clinicSchedule]
    );

    // Seed clinics for new doctors
    await db.run(
      `INSERT INTO clinics (doctor_id, name, address, schedule) VALUES (?, ?, ?, ?)`,
      [d4Id, 'Hunt Sports Orthopedics Suite', '101 Arena Way, NY', clinicSchedule]
    );
    await db.run(
      `INSERT INTO clinics (doctor_id, name, address, schedule) VALUES (?, ?, ?, ?)`,
      [d5Id, 'Foster Neurology Diagnostic Center', '33 Brain Wave St, Boston', clinicSchedule]
    );
    await db.run(
      `INSERT INTO clinics (doctor_id, name, address, schedule) VALUES (?, ?, ?, ?)`,
      [d6Id, 'Hahnemann Constitutional Healing Hub', '56 Similia Lane, SF', clinicSchedule]
    );
    await db.run(
      `INSERT INTO clinics (doctor_id, name, address, schedule) VALUES (?, ?, ?, ?)`,
      [d7Id, 'Barton Pediatric Homeopathy Care', '9 Nursery Court, NY', clinicSchedule]
    );
    await db.run(
      `INSERT INTO clinics (doctor_id, name, address, schedule) VALUES (?, ?, ?, ?)`,
      [d8Id, 'Shizhen Botanical Gastro clinic', '88 Herb Garden Rd, NY', clinicSchedule]
    );
    await db.run(
      `INSERT INTO clinics (doctor_id, name, address, schedule) VALUES (?, ?, ?, ?)`,
      [d9Id, 'Gladstar Adaptogen Stress Relief Spa', '14 Rosemary Glade, SF', clinicSchedule]
    );

    console.log('Database seeded successfully.');
  } else {
    console.log('Database already initialized and seeded.');
  }
}
