import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  assignLeaveBalancesSchema,
  attendanceImportSchema,
  attendanceUpdateSchema,
  departmentWriteSchema,
  employeeWriteSchema,
  holidayReleaseSchema,
  holidayWriteSchema,
  leaveCancelSchema,
  leaveCreateSchema,
  leaveHierarchyWriteSchema,
  leaveStatusSchema,
  signInSchema,
} from '../models/requestSchemas.js'
import { resolveUploadFilePath } from '../middleware/uploadsAccessMiddleware.js'

describe('requestSchemas', () => {
  it('accepts a valid sign-in body', () => {
    const parsed = signInSchema.parse({
      email: 'hr@example.com',
      password: 'any-password',
    })
    assert.equal(parsed.email, 'hr@example.com')
  })

  it('rejects invalid sign-in email', () => {
    const result = signInSchema.safeParse({
      email: 'not-an-email',
      password: 'any-password',
    })
    assert.equal(result.success, false)
  })

  it('strips unknown employee fields and requires name', () => {
    const parsed = employeeWriteSchema.parse({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      unexpected: 'drop-me',
    })
    assert.equal(parsed.name, 'Ada Lovelace')
    assert.equal('unexpected' in parsed, false)
  })

  it('rejects short employee passwords when provided', () => {
    const result = employeeWriteSchema.safeParse({
      name: 'Ada Lovelace',
      password: 'short',
    })
    assert.equal(result.success, false)
  })

  it('allows empty employee password (unchanged on update)', () => {
    const parsed = employeeWriteSchema.parse({
      name: 'Ada Lovelace',
      password: '',
    })
    assert.equal(parsed.password, '')
  })

  it('requires cancel reason', () => {
    const result = leaveCancelSchema.safeParse({ cancellationReason: '  ' })
    assert.equal(result.success, false)
  })

  it('validates leave create enum', () => {
    const parsed = leaveCreateSchema.parse({
      leaveType: 'Casual Leave',
      reason: 'Family event',
      startDate: '2026-08-10',
      endDate: '2026-08-11',
    })
    assert.equal(parsed.leaveType, 'Casual Leave')
  })

  it('rejects unknown leave type', () => {
    const result = leaveCreateSchema.safeParse({
      leaveType: 'Vacation',
      reason: 'Trip',
    })
    assert.equal(result.success, false)
  })

  it('validates attendance update', () => {
    const parsed = attendanceUpdateSchema.parse({
      employeeId: 'EMP-1001',
      date: '2026-08-01',
      status: 'Present',
      checkIn: '09:00 AM',
      checkOut: '06:00 PM',
    })
    assert.equal(parsed.status, 'Present')
  })

  it('validates attendance import shape', () => {
    const parsed = attendanceImportSchema.parse({
      filename: 'sheet.xlsx',
      records: [{ employeeId: 'EMP-1001', date: '2026-08-01' }],
    })
    assert.equal(parsed.records.length, 1)
  })

  it('validates department, holiday, hierarchy, balances, leave status', () => {
    assert.equal(
      departmentWriteSchema.parse({ name: 'Sales', headEmployeeId: null }).name,
      'Sales',
    )
    assert.equal(
      holidayWriteSchema.parse({
        name: 'Republic Day',
        date: '2026-01-26',
        type: 'National Holiday',
      }).type,
      'National Holiday',
    )
    assert.equal(
      holidayReleaseSchema.parse({
        holidays: [
          {
            name: 'Republic Day',
            date: '2026-01-26',
            type: 'National Holiday',
          },
        ],
      }).holidays.length,
      1,
    )
    assert.equal(
      leaveHierarchyWriteSchema.parse({
        name: 'Employee path',
        steps: [{ approverKind: 'department_head' }],
      }).steps[0].approverKind,
      'department_head',
    )
    assert.equal(
      assignLeaveBalancesSchema.parse({
        scope: 'all',
        casualLeaveBalance: 12,
        sickLeaveBalance: 8,
      }).scope,
      'all',
    )
    assert.equal(
      leaveStatusSchema.parse({ status: 'Rejected', rejectionReason: 'Busy' })
        .status,
      'Rejected',
    )
  })
})

describe('uploads path safety', () => {
  it('normalizes traversal attempts to a basename under uploads', () => {
    const resolved = resolveUploadFilePath('../secret.txt')
    assert.ok(resolved)
    assert.match(resolved, /[\\/]uploads[\\/]secret\.txt$/)
    assert.equal(resolveUploadFilePath(''), null)
    assert.equal(resolveUploadFilePath('.'), null)
    assert.equal(resolveUploadFilePath('..'), null)
  })

  it('accepts a bare upload filename', () => {
    const resolved = resolveUploadFilePath('avatar-123.png')
    assert.ok(resolved)
    assert.match(resolved, /avatar-123\.png$/)
  })
})
