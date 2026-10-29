import { DistressedVehicleCase, EmployeeUser } from '../types';

export const MOCK_EMPLOYEES: EmployeeUser[] = [
  {
    id: 'emp-mahmoud',
    name: 'محمود تامر',
    email: 'mahmoud.tamer@mokhalasa.com',
    role: 'owner',
    assignedCasesCount: 0,
    isActive: true
  },
  {
    id: 'emp-mahmoud-alt',
    name: 'محمود تامر',
    email: 'mahmoud@mokhalasa.com',
    role: 'owner',
    assignedCasesCount: 0,
    isActive: true
  },
  {
    id: 'emp-2',
    name: 'أحمد الشريف',
    email: 'ahmed@mokhalasa.com',
    role: 'case_officer',
    assignedCasesCount: 0,
    isActive: true
  }
];

// Initial pre-launch state: empty distressed cases queue
export const INITIAL_DISTRESSED_CASES: DistressedVehicleCase[] = [];
