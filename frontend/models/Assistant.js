import mongoose from 'mongoose';

const AssistantSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // References User._id string
  doctor_id: { type: String, default: null } // References Doctor._id string
});

export const Assistant = mongoose.models.Assistant || mongoose.model('Assistant', AssistantSchema);
