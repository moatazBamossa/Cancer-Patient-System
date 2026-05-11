// helpers
const today = new Date();
today.setHours(0, 0, 0, 0);

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const MOCK_VISITS = [
  {
    visit_id: 1,
    visit_date: new Date(today).setHours(9, 30), // TODAY 09:30
    visit_type: 'Follow-up',
    reason_for_visit: 'Post-chemo checkup',
    patients: {
      patient_id: 101,
      full_name: 'Ahmed Al-Rashidi',
      phone: '0501234567',
      mobile_number: '0551234567',
      national_id: '1082341234',
    },
    doctors: { doctor_id: 1, full_name: 'Dr. Mohammed Saleh' },
  },
  {
    visit_id: 2,
    visit_date: new Date(today).setHours(11, 0), // TODAY 11:00
    visit_type: 'Emergency',
    reason_for_visit: 'Severe side effects',
    patients: {
      patient_id: 102,
      full_name: 'Fatima Al-Zahrawi',
      phone: '0502345678',
      mobile_number: '0552345678',
      national_id: '1082349876',
    },
    doctors: { doctor_id: 2, full_name: 'Dr. Sara Hassan' },
  },
  {
    visit_id: 3,
    visit_date: addDays(today, 1).setHours(10, 15), // TOMORROW 10:15
    visit_type: 'Routine',
    reason_for_visit: 'Monthly lab review',
    patients: {
      patient_id: 103,
      full_name: 'Khalid Al-Otaibi',
      phone: '0503456789',
      mobile_number: null,
      national_id: '1082341111',
    },
    doctors: { doctor_id: 1, full_name: 'Dr. Mohammed Saleh' },
  },
  {
    visit_id: 4,
    visit_date: addDays(today, 1).setHours(14, 0), // TOMORROW 14:00
    visit_type: 'Follow-up',
    reason_for_visit: 'Imaging results review',
    patients: {
      patient_id: 104,
      full_name: 'Nora Al-Ghamdi',
      phone: '0504567890',
      mobile_number: '0554567890',
      national_id: '1082342222',
    },
    doctors: { doctor_id: 3, full_name: 'Dr. Layla Mahmoud' },
  },
  {
    visit_id: 5,
    visit_date: addDays(today, 2).setHours(8, 45), // IN 2 DAYS 08:45
    visit_type: 'Post-treatment',
    reason_for_visit: 'Final cycle assessment',
    patients: {
      patient_id: 105,
      full_name: 'Omar Al-Shammari',
      phone: '0505678901',
      mobile_number: null,
      national_id: '1082343333',
    },
    doctors: { doctor_id: 2, full_name: 'Dr. Sara Hassan' },
  },
];

export function getUpcomingVisits() {
  const twoDaysEnd = addDays(today, 2);
  twoDaysEnd.setHours(23, 59, 59, 999);
  const now = new Date();

  return MOCK_VISITS
    .filter((v) => new Date(v.visit_date) >= now && new Date(v.visit_date) <= twoDaysEnd)
    .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime());
}
