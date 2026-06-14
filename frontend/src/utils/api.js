const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get JWT headers
function getHeaders() {
  const token = localStorage.getItem('doctor_hub_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Helper to handle responses
async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  // Authentication
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(res);
    localStorage.setItem('doctor_hub_token', data.token);
    localStorage.setItem('doctor_hub_user', JSON.stringify(data.user));
    return data;
  },

  register: async (userData) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  forgotPassword: async (email, newPassword) => {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword }),
    });
    return handleResponse(res);
  },

  logout: () => {
    localStorage.removeItem('doctor_hub_token');
    localStorage.removeItem('doctor_hub_user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('doctor_hub_user');
    return user ? JSON.parse(user) : null;
  },

  // Doctors
  getDoctors: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_URL}/doctors?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getDoctorDetails: async (id) => {
    const res = await fetch(`${API_URL}/doctors/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateClinicSchedule: async (clinicId, clinicData) => {
    const res = await fetch(`${API_URL}/doctor/clinics/${clinicId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(clinicData),
    });
    return handleResponse(res);
  },

  // Appointments
  bookAppointment: async (bookingData) => {
    const res = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bookingData),
    });
    return handleResponse(res);
  },

  // Payments
  uploadPayment: async (paymentData) => {
    const res = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(paymentData),
    });
    return handleResponse(res);
  },

  // Dashboards
  getPatientDashboard: async () => {
    const res = await fetch(`${API_URL}/patient/dashboard`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getDoctorDashboard: async () => {
    const res = await fetch(`${API_URL}/doctor/dashboard`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getAssistantPayments: async () => {
    const res = await fetch(`${API_URL}/assistant/payments`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  verifyPayment: async (paymentId, status) => {
    const res = await fetch(`${API_URL}/assistant/verify-payment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ payment_id: paymentId, status }),
    });
    return handleResponse(res);
  },

  // Prescriptions
  addPrescription: async (prescriptionData) => {
    const res = await fetch(`${API_URL}/prescriptions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(prescriptionData),
    });
    return handleResponse(res);
  },

  // History Timeline
  getPatientHistory: async (patientId) => {
    const res = await fetch(`${API_URL}/patients/${patientId}/history`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  uploadPatientReport: async (patientId, reportData) => {
    const res = await fetch(`${API_URL}/patients/${patientId}/history/upload`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reportData),
    });
    return handleResponse(res);
  },

  // Administrative Control
  getAdminStats: async () => {
    const res = await fetch(`${API_URL}/admin/stats`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getAdminUsers: async () => {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateUserRole: async (userId, role) => {
    const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    return handleResponse(res);
  },

  assignAssistant: async (assistantId, doctorId) => {
    const res = await fetch(`${API_URL}/admin/assistants/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ assistant_id: assistantId, doctor_id: doctorId }),
    });
    return handleResponse(res);
  }
};
