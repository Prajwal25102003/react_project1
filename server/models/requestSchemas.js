import { z } from 'zod'

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')

const optionalNullableString = z
  .union([z.string(), z.null()])
  .optional()

/** Auth */
export const signInSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

/** Departments */
export const departmentWriteSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    headEmployeeId: optionalNullableString,
  })
  .passthrough()

/** Employees — shape gate; deep rules stay in the controller. */
export const employeeWriteSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
  })
  .passthrough()

export const assignLeaveBalancesSchema = z
  .object({
    scope: z.enum(['all', 'department', 'custom']),
    mode: z.enum(['set', 'add']).optional(),
    departmentId: optionalNullableString,
    employeeIds: z.array(z.union([z.string(), z.number()])).optional(),
    casualLeaveBalance: z.union([z.number(), z.string()]).optional(),
    sickLeaveBalance: z.union([z.number(), z.string()]).optional(),
  })
  .passthrough()

/** Attendance */
export const attendanceUpdateSchema = z
  .object({
    employeeId: z.string().trim().min(1, 'Employee is required'),
    date: dateString,
    status: z.enum(['Present', 'Absent', 'Half Day']),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
  })
  .passthrough()

export const attendanceImportSchema = z.object({
  records: z
    .array(z.record(z.string(), z.unknown()))
    .min(1, 'No attendance records to import')
    .max(5000, 'Import is limited to 5000 rows at a time'),
  filename: z.string().max(255).optional(),
})

/** Leave requests */
export const leaveCreateSchema = z
  .object({
    employeeId: z.string().optional(),
    leaveType: z.string().trim().min(1, 'Leave type is required'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    reason: z.string().trim().min(1, 'Leave reason is required'),
    duration: z.string().optional(),
    halfDaySession: z.string().optional(),
    expectedDeliveryDate: z.string().optional(),
    attachmentUrl: z.unknown().optional(),
    attachments: z.unknown().optional(),
  })
  .passthrough()

export const leaveStatusSchema = z
  .object({
    status: z.enum(['Approved', 'Rejected']),
    remarks: z.string().optional(),
    rejectionReason: z.string().optional(),
  })
  .passthrough()

export const leaveCancelSchema = z
  .object({
    cancellationReason: z.string().optional(),
  })
  .passthrough()

/** Holidays */
export const holidayWriteSchema = z
  .object({
    name: z.string().trim().min(1, 'Holiday name is required'),
    date: dateString,
    type: z.string().trim().min(1, 'Holiday type is required'),
    description: z.string().optional(),
  })
  .passthrough()

export const holidayReleaseSchema = z
  .object({
    holidays: z
      .array(z.record(z.string(), z.unknown()))
      .min(1, 'At least one holiday is required'),
  })
  .passthrough()

/** Leave approval hierarchy */
export const leaveHierarchyWriteSchema = z
  .object({
    name: z.string().optional(),
    steps: z
      .array(z.record(z.string(), z.unknown()))
      .min(1, 'At least one approval step is required'),
  })
  .passthrough()
