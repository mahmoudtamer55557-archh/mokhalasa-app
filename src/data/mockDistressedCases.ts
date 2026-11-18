import { DistressedVehicleCase, EmployeeUser } from '../types';

export const MOCK_EMPLOYEES: EmployeeUser[] = [
  {
    id: 'emp-mahmoud-gmail',
    name: 'محمود تامر',
    email: 'mahmoudtamer55557@gmail.com',
    role: 'owner',
    assignedCasesCount: 0,
    isActive: true
  },
  {
    id: 'emp-mahmoud-corp',
    name: 'محمود تامر (إدارة العمليات)',
    email: 'mahmoud@mokhalasa.com',
    role: 'owner',
    assignedCasesCount: 0,
    isActive: true
  },
  {
    id: 'emp-admin-online',
    name: 'مدير المنصة',
    email: 'admin@mokhalasa.online',
    role: 'admin',
    assignedCasesCount: 0,
    isActive: true
  }
];

// Initial pre-launch state: empty distressed cases queue
export const INITIAL_DISTRESSED_CASES: DistressedVehicleCase[] = [];
