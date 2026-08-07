import { z } from 'zod'

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')

const optionalNullableString = z
  .union([z.string(), z.null()])
  .optional()

const leaveBalanceValue = z.union([z.number(), z.string()])

/** Auth */
export const signInSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

/** Departments */
export const departmentWriteSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  headEmployeeId: optionalNullableString,
})

/**
 * Employees — allowlisted fields only (unknown keys stripped).
 * Deep business rules stay in the controller.
 */
export const employeeWriteSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().optional(),
  loginEmail: z.string().trim().optional(),
  gmail: z.string().trim().optional(),
  phone: z.string().optional(),
  gender: z.enum(['Male', 'Female']).optional(),
  departmentId: optionalNullableString,
  designation: z.string().optional(),
  joiningDate: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  salary: z.union([z.number(), z.string()]).optional(),
  avatar: optionalNullableString,
  casualLeaveBalance: leaveBalanceValue.optional(),
  sickLeaveBalance: leaveBalanceValue.optional(),
  password: z
    .string()
    .optional()
    .refine(
      (value) => value === undefined || value === '' || value.length >= 8,
      { message: 'Password must be at least 8 characters' },
    ),
  accountType: z.enum(['admin', 'employee']).optional(),
  role: z.enum(['admin', 'hr', 'employee']).optional(),
  country: z.string().optional(),
  cityState: z.string().optional(),
  postalCode: z.string().optional(),
})

export const assignLeaveBalancesSchema = z.object({
  scope: z.enum(['all', 'department', 'custom']),
  mode: z.enum(['set', 'add']).optional(),
  departmentId: optionalNullableString,
  employeeIds: z.array(z.union([z.string(), z.number()])).optional(),
  casualLeaveBalance: leaveBalanceValue,
  sickLeaveBalance: leaveBalanceValue,
})

/** Attendance */
export const attendanceUpdateSchema = z.object({
  employeeId: z.string().trim().min(1, 'Employee is required'),
  date: dateString,
  status: z.enum(['Present', 'Absent', 'Half Day']),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
})

export const attendanceImportSchema = z.object({
  records: z
    .array(z.record(z.string(), z.unknown()))
    .min(1, 'No attendance records to import')
    .max(5000, 'Import is limited to 5000 rows at a time'),
  filename: z.string().max(255).optional(),
})

/** Leave requests */
export const leaveCreateSchema = z.object({
  employeeId: z.string().optional(),
  leaveType: z.enum([
    'Sick Leave',
    'Casual Leave',
    'Maternity Leave',
    'Medical Leave',
    'Work from Home',
  ]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  reason: z.string().trim().min(1, 'Leave reason is required'),
  duration: z.enum(['full', 'half']).optional(),
  halfDaySession: z.enum(['first_half', 'second_half']).optional(),
  expectedDeliveryDate: z.string().optional(),
  attachmentUrl: z.union([z.string(), z.null()]).optional(),
  attachments: z
    .array(
      z.union([
        z.string(),
        z.object({
          url: z.string(),
          name: z.string().optional(),
          originalName: z.string().optional(),
        }),
      ]),
    )
    .optional(),
})

export const leaveStatusSchema = z.object({
  status: z.enum(['Approved', 'Rejected']),
  remarks: z.string().optional(),
  rejectionReason: z.string().optional(),
})

export const leaveCancelSchema = z.object({
  cancellationReason: z.string().trim().min(1, 'Cancellation reason is required'),
})

/** Holidays */
export const holidayWriteSchema = z.object({
  name: z.string().trim().min(1, 'Holiday name is required'),
  date: dateString,
  type: z.enum(['National Holiday', 'Optional Holiday', 'Festival Holiday']),
  description: z.string().optional(),
})

export const holidayReleaseSchema = z.object({
  holidays: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Holiday name is required'),
        date: dateString,
        type: z.enum([
          'National Holiday',
          'Optional Holiday',
          'Festival Holiday',
        ]),
        description: z.string().optional(),
      }),
    )
    .min(1, 'At least one holiday is required'),
})

/** Leave approval hierarchy */
export const leaveHierarchyWriteSchema = z.object({
  name: z.string().trim().min(1, 'Hierarchy name is required').max(120),
  steps: z
    .array(
      z.object({
        approverKind: z.enum(['department_head', 'role']),
        approverRole: z.enum(['hr', 'admin']).optional().nullable(),
        approverEmployeeId: optionalNullableString,
      }),
    )
    .min(1, 'At least one approval step is required'),
})
