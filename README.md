🩺 DoctorHub: Synchronized Medical Coordination Portal
A modern, full-stack healthcare platform designed to streamline booking, payment verifications, clinical scheduling, and patient history records. Built on a serverless micro-routing architecture, DoctorHub is optimized for deployment on the Vercel Hobby Plan (limited to <= 12 serverless functions) utilizing a cloud-native MongoDB Atlas database.

🌟 Core Features
👤 Patient Dashboard & Medical Timeline
Seamless Booking: Book appointments at specialized clinics by date and time slot.
Secure Payments: Upload screenshot verifications for clinical appointments.
Interactive Medical Timeline: Access historical timelines containing digital prescriptions and uploaded diagnostic lab reports.
Immutability Protection: Historical medical logs and past prescriptions are securely locked against updates/deletions.
🥼 Doctor Portal & Clinic Planner
Appointment Management: Review upcoming patient sessions sorted chronologically.
Clinic Scheduler: Dynamically update clinic addresses, opening schedules, and available session slots.
Digital Prescriptions: Generate new prescriptions containing diagnoses, specific medicines, and instructions, which dynamically bind to the patient's medical timeline.
🤝 Medical Assistant Dashboard
Payment Verification: Review payment screenshots uploaded by patients.
Clinic Administration: Confirm or reject bookings on behalf of the linked doctor.
🛡️ Admin & Super Admin Controls
Analytics Metrics: Real-time tracking of global revenue, registered doctor/patient counts, and total appointments.
User Directory: Global list of registered accounts with user roles.
Role Assignment: Dynamic role shifting (patient, doctor, assistant, admin, super_admin) and linking assistant profiles to active doctors.
🛠️ Architecture & Tech Stack
Frontend: React (v19) + Vite, styled using modern CSS variables with glassmorphic dashboards and micro-animations.
Backend: Vercel Serverless Functions (exactly 6 consolidated API handlers).
Database: MongoDB Atlas + Mongoose.
Authentication: JWT-based stateless RBAC (Role-Based Access Control) with CORS protection.
📂 Project Directory Structure
text

frontend/
├── dist/                 # Vite static production build output
├── public/               # Static icons and image assets
├── models/               # Mongoose Schema Definitions
│   ├── User.js
│   ├── Patient.js
│   ├── Doctor.js
│   ├── Assistant.js
│   ├── Clinic.js
│   ├── Appointment.js
│   ├── Payment.js
│   ├── Prescription.js
│   └── MedicalHistory.js
├── utils/                # Backend Helpers
│   ├── db.js             # Mongoose connection pooling (targets 'doctorhub')
│   └── auth.js           # JWT signing & CORS header middleware
├── api/                  # Consolidated Vercel Serverless Handlers (Exactly 6 files)
│   ├── auth.js           # POST /api/auth?action=login | register | forgot-password
│   ├── doctors.js        # GET/PUT /api/doctors?action=details | doctor-dashboard | update-clinic
│   ├── appointments.js   # GET/POST /api/appointments?action=patient-dashboard | patient-history | upload-report
│   ├── payments.js       # GET/POST /api/payments?action=assistant-payments | verify-payment
│   ├── prescriptions.js  # POST /api/prescriptions
│   └── admin.js          # GET/PUT /api/admin?action=stats | users | update-role | assign-assistant
├── src/                  # React Client Application
│   ├── pages/            # Dashboard page components
│   ├── utils/
│   │   └── api.js        # Frontend API client (safe text/JSON parsing helper)
│   ├── App.jsx           # Main React Router / Component switch
│   ├── main.jsx          # Vite client entry point
│   └── index.css         # Curated styling variables and animations
├── seed.js               # Database seeding script
├── local-runner.js       # Local backend server runner (ports serverless functions)
└── .env                  # Local configurations (ignored in git)
🚀 Local Development Setup
1. Prerequisites
Ensure you have Node.js (v18+) installed.

2. Configure Environment Variables
Create a .env file in the frontend root folder:

env

MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/doctorhub?retryWrites=true&w=majority
JWT_SECRET=doctor_hub_secret_key_2026
FRONTEND_URL=http://localhost:5173
3. Whitelist Network Access
Make sure your local development IP is whitelisted on your MongoDB Atlas dashboard (Security > Network Access). For serverless deployments, whitelisting 0.0.0.0/0 (Allows access from anywhere) is recommended.

4. Seed the Database
Populate your database with default roles, credentials, and test accounts:

bash

node seed.js
Default passwords for all seeded accounts are password123.

Test Patient: patient@doctorhub.com
Test Doctor: sarah.jenkins@doctorhub.com
Test Assistant: alex.carter@doctorhub.com
Test Super Admin: superadmin@doctorhub.com
5. Run the Local Development Servers
You will need two terminals running concurrently:

Terminal 1: Start the Local Backend Runner (Port 3000) This handles the serverless functions and database queries:

bash

node local-runner.js
Terminal 2: Start the Vite Frontend (Port 5173) This launches the client UI (which proxies /api calls directly to port 3000):

bash

npm run dev
Visit http://localhost:5173/ to interact with the portal locally!

🌐 Production Vercel Deployment
DoctorHub is pre-consolidated into exactly 6 serverless files, completely bypassing Vercel Hobby Plan limitations:

Create a new project in your Vercel Dashboard linking your repository.
Configure Build Settings:
Framework Preset: Vite
Root Directory: frontend
Add the Environment Variables in Vercel settings:
MONGODB_URI
JWT_SECRET
FRONTEND_URL (Set to your deployed Vercel domain e.g. https://yourproject.vercel.app)
Click Deploy. Vercel will host the React frontend statically and compile exactly 6 serverless functions in /api.
⚡ Robust Connectivity Fallback
Local development machines can sometimes encounter DNS TXT record lookups timeouts (queryTxt ETIMEOUT) when connecting via mongodb+srv://. DoctorHub's connection pooling (utils/db.js) and database seeder (seed.js) include an automatic fallback mechanism. If the DNS lookup times out, Mongoose will automatically fall back to connecting directly to the database replica set shards:

javascript

// Automatic direct replica set connection fallback
const fallbackURI = "mongodb://<user>:<pass>@shard-00-00:27017,shard-00-01:27017.../?replicaSet=atlas-zyuk7x-shard-0";
This guarantees 100% startup uptime both locally and in the cloud.
