const API_URL = import.meta.env.VITE_API_URL || '/api';

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

// Helper to handle responses and parse errors gracefully
async function handleResponse(response) {
  const text = await response.text();
  if (!response.ok) {
    try {
      const data = JSON.parse(text);
      throw new Error(data.error || text);
    } catch (e) {
      throw new Error(text || 'Request failed');
    }
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
    }
  }

  throw new Error(`Expected JSON response, but got HTML/text: ${text.substring(0, 100)}...`);
}

export const api = {
  // Authentication
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth?action=login`, {
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
    const res = await fetch(`${API_URL}/auth?action=register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  forgotPassword: async (email, newPassword) => {
    const res = await fetch(`${API_URL}/auth?action=forgot-password`, {
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
    const res = await fetch(`${API_URL}/doctors?action=details&id=${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateClinicSchedule: async (clinicId, clinicData) => {
    const res = await fetch(`${API_URL}/doctors?action=update-clinic&clinicId=${clinicId}`, {
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
    const res = await fetch(`${API_URL}/appointments?action=patient-dashboard`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getDoctorDashboard: async () => {
    const res = await fetch(`${API_URL}/doctors?action=doctor-dashboard`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getAssistantPayments: async () => {
    const res = await fetch(`${API_URL}/payments?action=assistant-payments`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  verifyPayment: async (paymentId, status) => {
    const res = await fetch(`${API_URL}/payments?action=verify-payment`, {
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
    const res = await fetch(`${API_URL}/appointments?action=patient-history&patientId=${patientId}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  uploadPatientReport: async (patientId, reportData) => {
    const res = await fetch(`${API_URL}/appointments?action=upload-report&patientId=${patientId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reportData),
    });
    return handleResponse(res);
  },

  // Administrative Control
  getAdminStats: async () => {
    const res = await fetch(`${API_URL}/admin?action=stats`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getAdminUsers: async () => {
    const res = await fetch(`${API_URL}/admin?action=users`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateUserRole: async (userId, role) => {
    const res = await fetch(`${API_URL}/admin?action=update-role&userId=${userId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    return handleResponse(res);
  },

  assignAssistant: async (assistantId, doctorId) => {
    const res = await fetch(`${API_URL}/admin?action=assign-assistant`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ assistant_id: assistantId, doctor_id: doctorId }),
    });
    return handleResponse(res);
  }
};
