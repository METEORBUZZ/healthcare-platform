export const SPECIALIZATIONS = [
  'Cardiologist',
  'General Physician',
  'Dermatologist',
  'Orthopedic',
  'Pediatrician',
  'ENT Specialist',
  'Neurologist',
  'Psychiatrist',
] as const;

export type Specialization = (typeof SPECIALIZATIONS)[number];
