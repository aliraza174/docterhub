import { connectToDatabase } from '../../../utils/db';
import { MedicalHistory } from '../../../models/MedicalHistory';
import { User } from '../../../models/User';
import { Prescription } from '../../../models/Prescription';
import { verifyAuth, setCorsHeaders } from '../../../utils/auth';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

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

  await connectToDatabase();
  const user = await verifyAuth(req, res);
  if (!user) return;

  const patientId = req.query.id; // dynamic routing param

  // SECURITY RBAC: Patients can only view their own history. Others (doctors, assistants, admins) can view it.
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

    res.json(formattedHistory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch medical history' });
  }
}
