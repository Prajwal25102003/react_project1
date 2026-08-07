import { query, connectDatabase } from '../config/db.js'

await connectDatabase()

const hr = await query(`
  SELECT e.id, e.name, e.casual_leave_balance, e.sick_leave_balance, e.lop_days, u.role
  FROM employees e
  LEFT JOIN users u ON u.employee_id = e.id
  WHERE u.role = 'hr'
  ORDER BY e.id
`)
console.log('HR employees:', JSON.stringify(hr.rows, null, 2))

const leaves = await query(`
  SELECT lr.id, lr.employee_id, e.name, lr.leave_type, lr.leave_days, lr.start_date, lr.end_date, lr.status,
         e.casual_leave_balance, e.sick_leave_balance, e.lop_days
  FROM leave_requests lr
  JOIN employees e ON e.id = lr.employee_id
  LEFT JOIN users u ON u.employee_id = e.id
  WHERE u.role = 'hr'
  ORDER BY lr.created_at DESC
  LIMIT 10
`)
console.log('HR leave requests:', JSON.stringify(leaves.rows, null, 2))

process.exit(0)
