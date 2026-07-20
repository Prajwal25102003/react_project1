/**
 * Seeds 105 employees:
 *   HR (DEP-02): 5 including head
 *   Other departments: 20 each including head
 *
 * Usage:
 *   node server/scripts/seedEmployees.js
 *   import { seedEmployees } from './seedEmployees.js'
 */
import path from 'path'
import { fileURLToPath } from 'url'
import pool, { connectDatabase, query } from '../config/db.js'

const DEPARTMENT_TARGETS = [
  { id: 'DEP-01', count: 20, headId: 'EMP-1001' },
  { id: 'DEP-02', count: 5, headId: 'EMP-1002' },
  { id: 'DEP-03', count: 20, headId: 'EMP-1003' },
  { id: 'DEP-04', count: 20, headId: 'EMP-1004' },
  { id: 'DEP-05', count: 20, headId: 'EMP-1006' },
  { id: 'DEP-06', count: 20, headId: 'EMP-1007' },
]

const ANCHORS = [
  {
    id: 'EMP-1001',
    name: 'Arjun Tejas',
    email: 'arjuntejas@company.in',
    phone: '+91 98765 41001',
    gender: 'Male',
    departmentId: 'DEP-01',
    designation: 'Senior Frontend Developer',
    joiningDate: '2022-03-14',
    salary: 95000,
    status: 'Active',
  },
  {
    id: 'EMP-1002',
    name: 'Siddharth Menon',
    email: 'siddharthmenon@company.in',
    phone: '+91 98765 41002',
    gender: 'Male',
    departmentId: 'DEP-02',
    designation: 'HR Manager',
    joiningDate: '2021-08-02',
    salary: 88000,
    status: 'Active',
  },
  {
    id: 'EMP-1003',
    name: 'Rohan Sameer',
    email: 'rohansameer@company.in',
    phone: '+91 98765 41003',
    gender: 'Male',
    departmentId: 'DEP-03',
    designation: 'Content Strategist',
    joiningDate: '2023-01-20',
    salary: 62000,
    status: 'Active',
  },
  {
    id: 'EMP-1004',
    name: 'Vikram Nikhil',
    email: 'vikramnikhil@company.in',
    phone: '+91 98765 41004',
    gender: 'Male',
    departmentId: 'DEP-04',
    designation: 'Sales Executive',
    joiningDate: '2020-11-09',
    salary: 55000,
    status: 'Inactive',
  },
  {
    id: 'EMP-1005',
    name: 'Ananya Reva',
    email: 'ananyareva@company.in',
    phone: '+91 98765 41005',
    gender: 'Female',
    departmentId: 'DEP-01',
    designation: 'Backend Developer',
    joiningDate: '2024-06-01',
    salary: 78000,
    status: 'Active',
  },
  {
    id: 'EMP-1006',
    name: 'Suresh Milan',
    email: 'sureshmilan@company.in',
    phone: '+91 98765 41006',
    gender: 'Male',
    departmentId: 'DEP-05',
    designation: 'Payroll Specialist',
    joiningDate: '2022-09-15',
    salary: 70000,
    status: 'Active',
  },
  {
    id: 'EMP-1007',
    name: 'Kavya Tara',
    email: 'kavyatara@company.in',
    phone: '+91 98765 41007',
    gender: 'Female',
    departmentId: 'DEP-06',
    designation: 'Operations Lead',
    joiningDate: '2019-04-22',
    salary: 92000,
    status: 'Active',
  },
  {
    id: 'EMP-1008',
    name: 'Aditya Kunal',
    email: 'adityakunal@company.in',
    phone: '+91 98765 41008',
    gender: 'Male',
    departmentId: 'DEP-01',
    designation: 'QA Engineer',
    joiningDate: '2025-02-10',
    salary: 58000,
    status: 'Active',
  },
  {
    id: 'EMP-1999',
    name: 'Rahul Aman',
    email: 'rahulaman@company.in',
    phone: '+91 98765 41999',
    gender: 'Male',
    departmentId: 'DEP-01',
    designation: 'System Administrator',
    joiningDate: '2020-01-15',
    salary: 150000,
    status: 'Active',
  },
]

const FIRST_NAMES = [
  ['Aarav', 'Male'],
  ['Vivaan', 'Male'],
  ['Aditya', 'Male'],
  ['Vihaan', 'Male'],
  ['Arjun', 'Male'],
  ['Sai', 'Male'],
  ['Reyansh', 'Male'],
  ['Ayaan', 'Male'],
  ['Krishna', 'Male'],
  ['Ishaan', 'Male'],
  ['Shaurya', 'Male'],
  ['Atharv', 'Male'],
  ['Kabir', 'Male'],
  ['Dhruv', 'Male'],
  ['Rudra', 'Male'],
  ['Ananya', 'Female'],
  ['Aadhya', 'Female'],
  ['Diya', 'Female'],
  ['Myra', 'Female'],
  ['Sara', 'Female'],
  ['Ira', 'Female'],
  ['Prisha', 'Female'],
  ['Anvi', 'Female'],
  ['Kiara', 'Female'],
  ['Pari', 'Female'],
  ['Riya', 'Female'],
  ['Saanvi', 'Female'],
  ['Navya', 'Female'],
  ['Meera', 'Female'],
  ['Isha', 'Female'],
]

const LAST_NAMES = [
  'Sharma',
  'Patel',
  'Reddy',
  'Nair',
  'Iyer',
  'Gupta',
  'Mehta',
  'Joshi',
  'Kulkarni',
  'Desai',
  'Banerjee',
  'Mukherjee',
  'Chatterjee',
  'Pillai',
  'Rao',
  'Singh',
  'Verma',
  'Malhotra',
  'Kapoor',
  'Chopra',
  'Agarwal',
  'Bhat',
  'Das',
  'Ghosh',
  'Khan',
  'Shetty',
  'Menon',
  'Pandey',
  'Thakur',
  'Jain',
]

const DESIGNATIONS = {
  'DEP-01': [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'QA Engineer',
    'DevOps Engineer',
    'Mobile Developer',
    'UI Engineer',
    'Software Engineer',
  ],
  'DEP-02': [
    'HR Executive',
    'Talent Acquisition Specialist',
    'People Operations Associate',
    'HR Business Partner',
  ],
  'DEP-03': [
    'Marketing Executive',
    'Digital Marketer',
    'Content Writer',
    'Brand Associate',
    'SEO Specialist',
    'Social Media Manager',
    'Campaign Analyst',
  ],
  'DEP-04': [
    'Sales Executive',
    'Account Manager',
    'Business Development Executive',
    'Inside Sales Associate',
    'Key Account Executive',
    'Sales Coordinator',
  ],
  'DEP-05': [
    'Accountant',
    'Financial Analyst',
    'Payroll Associate',
    'Accounts Executive',
    'Tax Associate',
    'Billing Specialist',
  ],
  'DEP-06': [
    'Operations Executive',
    'Process Coordinator',
    'Vendor Manager',
    'Logistics Associate',
    'Delivery Coordinator',
    'Operations Analyst',
  ],
}

const SALARY_RANGES = {
  'DEP-01': [52000, 110000],
  'DEP-02': [48000, 90000],
  'DEP-03': [45000, 85000],
  'DEP-04': [42000, 95000],
  'DEP-05': [50000, 100000],
  'DEP-06': [48000, 98000],
}

function padEmpId(num) {
  return `EMP-${num}`
}

function slugEmail(first, last, num) {
  const base = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '')
  return `${base}${num}@company.in`
}

function formatPhone(num) {
  const n = String(41000 + num).padStart(5, '0')
  return `+91 98765 ${n}`
}

function joiningDateFor(index) {
  const year = 2019 + (index % 7)
  const month = String((index % 12) + 1).padStart(2, '0')
  const day = String((index % 27) + 1).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function salaryFor(departmentId, index) {
  const [min, max] = SALARY_RANGES[departmentId]
  const span = max - min
  return min + ((index * 3700) % (span + 1))
}

function buildEmployees() {
  const byDept = Object.fromEntries(
    DEPARTMENT_TARGETS.map((dept) => [dept.id, []]),
  )

  for (const anchor of ANCHORS) {
    byDept[anchor.departmentId].push(anchor)
  }

  let nextId = 1009
  let nameIndex = 0
  const usedEmails = new Set(ANCHORS.map((row) => row.email))

  for (const dept of DEPARTMENT_TARGETS) {
    const needed = dept.count - byDept[dept.id].length
    for (let i = 0; i < needed; i += 1) {
      const [first, gender] = FIRST_NAMES[nameIndex % FIRST_NAMES.length]
      const last = LAST_NAMES[(nameIndex * 3) % LAST_NAMES.length]
      nameIndex += 1

      let email = slugEmail(first, last, nextId)
      let suffix = 1
      while (usedEmails.has(email)) {
        email = slugEmail(first, last, `${nextId}${suffix}`)
        suffix += 1
      }
      usedEmails.add(email)

      const titles = DESIGNATIONS[dept.id]
      byDept[dept.id].push({
        id: padEmpId(nextId),
        name: `${first} ${last}`,
        email,
        phone: formatPhone(nextId),
        gender,
        departmentId: dept.id,
        designation: titles[i % titles.length],
        joiningDate: joiningDateFor(nextId),
        salary: salaryFor(dept.id, nextId),
        status: nextId % 11 === 0 ? 'Inactive' : 'Active',
      })
      nextId += 1
    }
  }

  const employees = DEPARTMENT_TARGETS.flatMap((dept) => byDept[dept.id])
  if (employees.length !== 105) {
    throw new Error(`Expected 105 employees, built ${employees.length}`)
  }
  return employees
}

export async function seedEmployees() {
  const employees = buildEmployees()

  for (const employee of employees) {
    await query(
      `INSERT INTO employees (
        id, name, email, phone, gender, department_id, designation,
        joining_date, salary, status, avatar,
        casual_leave_balance, sick_leave_balance, lop_days
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, 1, 1, 0
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        gender = EXCLUDED.gender,
        department_id = EXCLUDED.department_id,
        designation = EXCLUDED.designation,
        joining_date = EXCLUDED.joining_date,
        salary = EXCLUDED.salary,
        status = EXCLUDED.status,
        avatar = EXCLUDED.avatar,
        casual_leave_balance = 1,
        sick_leave_balance = 1,
        lop_days = 0`,
      [
        employee.id,
        employee.name,
        employee.email,
        employee.phone,
        employee.gender,
        employee.departmentId,
        employee.designation,
        employee.joiningDate,
        employee.salary,
        employee.status,
      ],
    )
  }

  for (const dept of DEPARTMENT_TARGETS) {
    await query(
      `UPDATE departments
       SET head_employee_id = $2,
           employee_count = $3
       WHERE id = $1`,
      [dept.id, dept.headId, dept.count],
    )
  }

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_departments_head_employee'
      ) THEN
        ALTER TABLE departments
          ADD CONSTRAINT fk_departments_head_employee
          FOREIGN KEY (head_employee_id) REFERENCES employees(id);
      END IF;
    END $$;
  `)

  console.log(`Seeded ${employees.length} employees`)
  return employees.length
}

async function main() {
  await connectDatabase()
  await seedEmployees()
  await pool.end()
}

const runningDirectly =
  path.resolve(fileURLToPath(import.meta.url)) ===
  path.resolve(process.argv[1] || '')

if (runningDirectly) {
  main().catch(async (error) => {
    console.error(error)
    try {
      await pool.end()
    } catch {
      // ignore
    }
    process.exit(1)
  })
}
