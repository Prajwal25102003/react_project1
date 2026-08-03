/**
 * Leave notification workflow helpers.
 * Meta stamps + read-time enrichment so copy adapts when hierarchy / dept head changes.
 */

import { query } from '../config/db.js'
import { findStepsByLeaveRequestIds } from '../models/leaveRequestsModel.js'
import { stepDisplayLabel } from '../models/leaveApprovalHierarchyModel.js'

function parseMeta(meta) {
  if (!meta) return {}
  if (typeof meta === 'string') {
    try {
      return JSON.parse(meta) || {}
    } catch {
      return {}
    }
  }
  return { ...meta }
}

function leaveIdFromActivityId(id) {
  const match = String(id || '').match(/^leave-(.+)$/i)
  return match ? match[1] : null
}

/** Snapshot of who should act — used for notification targeting + copy. */
export function approverMetaFromStep(
  step,
  { departmentHeadId = null, requesterEmployeeId = null } = {},
) {
  if (!step) return null
  return {
    approverKind: step.approverKind,
    approverRole: step.approverRole || null,
    approverEmployeeId: step.approverEmployeeId || null,
    departmentHeadId: departmentHeadId || null,
    requesterEmployeeId: requesterEmployeeId || null,
    stepLabel: stepDisplayLabel(step),
    stepOrder: Number(step.stepOrder) || null,
  }
}

/** Ordered step labels from a hierarchy snapshot (adapts to configured chain). */
export function hierarchyLabelsFromSteps(steps = []) {
  return (steps || [])
    .slice()
    .sort((a, b) => Number(a.stepOrder) - Number(b.stepOrder))
    .map((step) => stepDisplayLabel(step))
    .filter(Boolean)
}

function isLeaveRow(row) {
  return (
    String(row?.category || '') === 'Leave' ||
    String(row?.eventType || '').startsWith('leave.')
  )
}

/**
 * Patch leave activity rows with live request step + department head so
 * sent/received/you/forwarded copy follows the current workflow.
 */
export async function enrichLeaveActivityRows(rows = []) {
  const list = Array.isArray(rows) ? rows : []
  if (list.length === 0) return list

  const leaveIds = new Set()
  for (const row of list) {
    if (!isLeaveRow(row)) continue
    const meta = parseMeta(row.meta)
    const leaveId = meta.leaveRequestId || leaveIdFromActivityId(row.id)
    if (leaveId) leaveIds.add(String(leaveId))
  }

  if (leaveIds.size === 0) return list

  const ids = [...leaveIds]
  const [leaveResult, stepsByRequest, lastApprovalResult, lastDecisionResult] =
    await Promise.all([
      query(
        `SELECT
         lr.id,
         lr.status,
         lr.current_step AS "currentStep",
         lr.employee_id AS "employeeId",
         e.name AS "employeeName",
         lr.leave_type AS "leaveType",
         lr.start_date AS "startDate",
         lr.end_date AS "endDate",
         d.head_employee_id AS "departmentHeadId",
         (
           SELECT MIN(s.step_order)
           FROM leave_request_hierarchy_steps s
           WHERE s.leave_request_id = lr.id
         ) AS "firstStep"
       FROM leave_requests lr
       INNER JOIN employees e ON e.id = lr.employee_id
       LEFT JOIN departments d ON d.id = e.department_id
       WHERE lr.id = ANY($1::varchar[])`,
        [ids],
      ),
      findStepsByLeaveRequestIds(ids),
      // Latest mid-chain approval (for in-progress copy).
      query(
        `SELECT DISTINCT ON (h.leave_request_id)
         h.leave_request_id AS "leaveRequestId",
         h.actor_name AS "actorName",
         h.actor_role AS "actorRole",
         h.actor_employee_id AS "actorEmployeeId",
         h.step,
         h.action,
         h.remarks
       FROM leave_approval_history h
       WHERE h.leave_request_id = ANY($1::varchar[])
         AND h.action = 'Approved'
         AND h.step <> 'Submit'
       ORDER BY h.leave_request_id, h.created_at DESC NULLS LAST, h.id DESC`,
        [ids],
      ),
      // Latest terminal decision (approve / reject) for closed-request copy.
      query(
        `SELECT DISTINCT ON (h.leave_request_id)
         h.leave_request_id AS "leaveRequestId",
         h.actor_name AS "actorName",
         h.actor_role AS "actorRole",
         h.actor_employee_id AS "actorEmployeeId",
         h.step,
         h.action,
         h.remarks
       FROM leave_approval_history h
       WHERE h.leave_request_id = ANY($1::varchar[])
         AND h.action IN ('Approved', 'Rejected')
         AND h.step <> 'Submit'
       ORDER BY h.leave_request_id, h.created_at DESC NULLS LAST, h.id DESC`,
        [ids],
      ),
    ])

  const leaveById = new Map(
    (leaveResult.rows || []).map((row) => [String(row.id), row]),
  )
  const lastApprovalByLeave = new Map(
    (lastApprovalResult.rows || []).map((row) => [
      String(row.leaveRequestId),
      row,
    ]),
  )
  const lastDecisionByLeave = new Map(
    (lastDecisionResult.rows || []).map((row) => [
      String(row.leaveRequestId),
      row,
    ]),
  )

  function stepLabelFromHistory(step, fallback = '') {
    if (step === 'TeamLead') return 'Team Lead'
    if (step === 'HR') return 'HR'
    if (step === 'Admin') return 'Admin'
    return fallback
  }

  return list
    .map((row) => {
      if (!isLeaveRow(row)) return row

      const meta = parseMeta(row.meta)
      const leaveId = String(
        meta.leaveRequestId || leaveIdFromActivityId(row.id) || '',
      )
      if (!leaveId) return row

      const leave = leaveById.get(leaveId)
      if (!leave) return row

      const steps = stepsByRequest.get(leaveId) || []
      const departmentHeadId = leave.departmentHeadId || null
      const requesterEmployeeId = leave.employeeId
      const hierarchyLabels = hierarchyLabelsFromSteps(steps)
      const currentStep = steps.find(
        (step) => Number(step.stepOrder) === Number(leave.currentStep),
      )
      const firstStepOrder =
        leave.firstStep === null || leave.firstStep === undefined
          ? null
          : Number(leave.firstStep)
      const isMidChainPending =
        leave.status === 'Pending' &&
        leave.currentStep != null &&
        firstStepOrder != null &&
        Number(leave.currentStep) !== firstStepOrder

      const hierarchyApprovers = steps.map((step) =>
        approverMetaFromStep(step, {
          departmentHeadId,
          requesterEmployeeId,
        }),
      )

      const nextMeta = {
        ...meta,
        leaveRequestId: leaveId,
        subjectName: meta.subjectName || leave.employeeName,
        leaveType: meta.leaveType || leave.leaveType,
        hierarchyLabels,
        hierarchyApprovers,
        departmentHeadId,
        currentStepOrder:
          leave.currentStep != null ? Number(leave.currentStep) : null,
      }

      // Prefer stored range; fall back so personalization still runs after hierarchy sync.
      if (!nextMeta.range && leave.startDate) {
        const start = String(leave.startDate).slice(0, 10)
        const end = String(leave.endDate || leave.startDate).slice(0, 10)
        nextMeta.range = start === end ? start : `${start} to ${end}`
      }

      // Always refresh live department head on approver targets.
      if (nextMeta.currentApprover) {
        nextMeta.currentApprover = {
          ...nextMeta.currentApprover,
          departmentHeadId,
          requesterEmployeeId,
        }
      }
      if (nextMeta.nextApprover) {
        nextMeta.nextApprover = {
          ...nextMeta.nextApprover,
          departmentHeadId,
          requesterEmployeeId,
        }
      }

      let eventType = row.eventType
      let title = row.title
      let actorEmployeeId = row.actorEmployeeId
      let status = row.status

      if (leave.status === 'Pending' && currentStep) {
        const liveApprover = approverMetaFromStep(currentStep, {
          departmentHeadId,
          requesterEmployeeId,
        })

        if (isMidChainPending) {
          // Synthetic / stale submit rows → mid-chain "forwarded / in progress".
          const last = lastApprovalByLeave.get(leaveId)
          eventType = 'leave.approved'
          title = 'Leave Request In Progress'
          nextMeta.awaitsNext = true
          nextMeta.finalStatus = 'Pending'
          nextMeta.nextApprover = liveApprover
          nextMeta.currentApprover = liveApprover
          if (last) {
            nextMeta.actorName = last.actorName || nextMeta.actorName
            nextMeta.actorRole = last.actorRole || nextMeta.actorRole
            nextMeta.stepLabel =
              stepLabelFromHistory(
                last.step,
                nextMeta.stepLabel || liveApprover?.stepLabel,
              )
            if (last.actorEmployeeId) {
              actorEmployeeId = last.actorEmployeeId
            }
            if (last.remarks) nextMeta.remarks = last.remarks
          }
        } else {
          // Step-1 pending: always mirror live hierarchy (adapts when chain changes).
          nextMeta.currentApprover = liveApprover
          nextMeta.currentStepLabel = liveApprover?.stepLabel || ''
          nextMeta.awaitsNext = false
          nextMeta.finalStatus = 'Pending'
          if (
            !eventType ||
            eventType === 'leave.submitted' ||
            String(row.id || '').startsWith('leave-')
          ) {
            eventType = eventType || 'leave.submitted'
          }
        }
      }

      if (
        leave.status === 'Approved' ||
        leave.status === 'Rejected' ||
        leave.status === 'Cancelled'
      ) {
        nextMeta.awaitsNext = false
        nextMeta.finalStatus = leave.status
        nextMeta.currentApprover = null
        nextMeta.nextApprover = null
        status = leave.status

        // Drop stale open-workflow rows; the terminal decision activity owns the outcome.
        const isStaleSubmit = eventType === 'leave.submitted'
        const isStaleForward =
          eventType === 'leave.approved' &&
          (String(row.status || '') === 'Pending' || Boolean(meta.awaitsNext))
        if (isStaleSubmit || isStaleForward) {
          return null
        }

        // Synthetic leave-{id} rows (and thin decision rows) get actor/remarks from history.
        const decision = lastDecisionByLeave.get(leaveId)
        if (
          decision &&
          (leave.status === 'Rejected' || leave.status === 'Approved')
        ) {
          if (!actorEmployeeId && decision.actorEmployeeId) {
            actorEmployeeId = decision.actorEmployeeId
          }
          nextMeta.actorName = nextMeta.actorName || decision.actorName || ''
          nextMeta.actorRole = nextMeta.actorRole || decision.actorRole || ''
          nextMeta.stepLabel =
            nextMeta.stepLabel ||
            stepLabelFromHistory(decision.step, '') ||
            ''
          if (!nextMeta.remarks && decision.remarks) {
            nextMeta.remarks = decision.remarks
          }
        }

        if (leave.status === 'Rejected') {
          if (!eventType || String(row.id || '').startsWith('leave-')) {
            eventType = 'leave.rejected'
            title = 'Leave Request Rejected'
          }
        } else if (leave.status === 'Approved') {
          if (!eventType || String(row.id || '').startsWith('leave-')) {
            eventType = 'leave.approved'
            title = 'Leave Request Approved'
          }
        } else if (leave.status === 'Cancelled') {
          if (
            !eventType ||
            eventType === 'leave.submitted' ||
            String(row.id || '').startsWith('leave-')
          ) {
            eventType = 'leave.cancelled'
            title = 'Leave Request Cancelled'
          }
        }
      }

      return {
        ...row,
        title,
        status,
        eventType,
        actorEmployeeId,
        meta: nextMeta,
      }
    })
    .filter(Boolean)
}

/** Patch open submit activities when step-1 hierarchy snapshot is refreshed. */
export async function syncLeaveSubmittedActivityApprovers(
  updates = [],
  client = null,
) {
  const runner = client || { query }
  for (const item of updates) {
    const leaveRequestId = String(item?.leaveRequestId || '').trim()
    const currentApprover = item?.currentApprover
    if (!leaveRequestId || !currentApprover) continue

    await runner.query(
      `UPDATE recent_activities
       SET meta = COALESCE(meta, '{}'::jsonb)
         || jsonb_build_object(
              'currentApprover', $2::jsonb,
              'currentStepLabel', $3::text,
              'hierarchyLabels', COALESCE($4::jsonb, '[]'::jsonb),
              'departmentHeadId', to_jsonb($5::text)
            )
       WHERE category = 'Leave'
         AND event_type = 'leave.submitted'
         AND meta->>'leaveRequestId' = $1`,
      [
        leaveRequestId,
        JSON.stringify(currentApprover),
        currentApprover.stepLabel || '',
        JSON.stringify(item.hierarchyLabels || []),
        item.departmentHeadId || null,
      ],
    )
  }
}
