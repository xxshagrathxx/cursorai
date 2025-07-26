export const samplePatients = [
  {
    id: 1,
    name: "Sarah Johnson",
    phone: "+1 (555) 123-4567",
    email: "sarah.johnson@email.com",
    dateOfBirth: "1985-03-15",
    lastVisit: "2024-01-15",
    nextAppointment: "2024-02-15",
    treatmentHistory: [
      {
        date: "2024-01-15",
        treatment: "Dental Cleaning",
        notes: "Regular cleaning, good oral hygiene",
        cost: 120
      },
      {
        date: "2023-12-01",
        treatment: "Cavity Filling",
        notes: "Small cavity on upper molar",
        cost: 180
      }
    ],
    followUps: [
      {
        id: 1,
        type: "post-treatment",
        scheduledDate: "2024-01-17",
        status: "completed",
        notes: "Patient feeling well, no complications"
      },
      {
        id: 2,
        type: "appointment-reminder",
        scheduledDate: "2024-02-13",
        status: "pending",
        notes: "Remind about upcoming cleaning appointment"
      }
    ]
  },
  {
    id: 2,
    name: "Michael Chen",
    phone: "+1 (555) 987-6543",
    email: "m.chen@email.com",
    dateOfBirth: "1978-07-22",
    lastVisit: "2024-01-20",
    nextAppointment: "2024-03-01",
    treatmentHistory: [
      {
        date: "2024-01-20",
        treatment: "Root Canal",
        notes: "Root canal on lower molar, prescribed antibiotics",
        cost: 850
      }
    ],
    followUps: [
      {
        id: 3,
        type: "post-treatment",
        scheduledDate: "2024-01-22",
        status: "completed",
        notes: "Pain managed well, healing properly"
      },
      {
        id: 4,
        type: "post-treatment",
        scheduledDate: "2024-01-27",
        status: "overdue",
        notes: "Check healing progress"
      }
    ]
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    phone: "+1 (555) 456-7890",
    email: "emily.r@email.com",
    dateOfBirth: "1992-11-08",
    lastVisit: "2024-01-25",
    nextAppointment: "2024-02-20",
    treatmentHistory: [
      {
        date: "2024-01-25",
        treatment: "Teeth Whitening",
        notes: "Professional whitening treatment",
        cost: 300
      }
    ],
    followUps: [
      {
        id: 5,
        type: "satisfaction-survey",
        scheduledDate: "2024-01-28",
        status: "pending",
        notes: "Follow up on whitening satisfaction"
      }
    ]
  },
  {
    id: 4,
    name: "David Thompson",
    phone: "+1 (555) 321-0987",
    email: "d.thompson@email.com",
    dateOfBirth: "1965-04-12",
    lastVisit: "2024-01-10",
    nextAppointment: "2024-04-10",
    treatmentHistory: [
      {
        date: "2024-01-10",
        treatment: "Dental Implant Consultation",
        notes: "Consultation for missing tooth replacement",
        cost: 150
      }
    ],
    followUps: [
      {
        id: 6,
        type: "treatment-decision",
        scheduledDate: "2024-01-24",
        status: "pending",
        notes: "Follow up on implant decision"
      }
    ]
  }
];

export const followUpTypes = [
  {
    id: "post-treatment",
    name: "Post-Treatment Check",
    description: "Follow up after dental procedures",
    defaultDays: 2,
    color: "blue"
  },
  {
    id: "appointment-reminder",
    name: "Appointment Reminder",
    description: "Remind patients of upcoming appointments",
    defaultDays: 2,
    color: "green"
  },
  {
    id: "satisfaction-survey",
    name: "Satisfaction Survey",
    description: "Check patient satisfaction with treatment",
    defaultDays: 3,
    color: "purple"
  },
  {
    id: "treatment-decision",
    name: "Treatment Decision",
    description: "Follow up on treatment plan decisions",
    defaultDays: 7,
    color: "orange"
  },
  {
    id: "payment-reminder",
    name: "Payment Reminder",
    description: "Gentle reminder for outstanding payments",
    defaultDays: 7,
    color: "red"
  }
];

export const appointmentTypes = [
  "Cleaning",
  "Checkup",
  "Cavity Filling",
  "Root Canal",
  "Crown",
  "Extraction",
  "Whitening",
  "Implant",
  "Orthodontics",
  "Emergency"
];