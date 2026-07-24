import { useLeaveForm } from "../../controllers/leaveRequestsController.js";
import {
  HALF_DAY_SESSIONS,
  LEAVE_DURATIONS,
  MAX_MEDICAL_ATTACHMENTS,
  attachmentFileLabel,
} from "../../models/leaveRequestsModel.js";
import {
  FORM_GRID_CLASS,
  FORM_STACK_CLASS,
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
  LABEL_CLASS,
  TEXTAREA_CLASS,
} from "../../models/formLayoutModel.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import LeaveBalancePanel from "../components/LeaveBalancePanel.jsx";
import PageCard from "../components/PageCard.jsx";
import DateField from "../components/forms/DateField.jsx";
import { FieldError, RequiredMark } from "../components/forms/FormHelpers.jsx";
import SelectField from "../components/forms/SelectField.jsx";

function LeaveFormPage() {
  const {
    form,
    fieldErrors,
    employees,
    availableLeaveTypes,
    maternitySelected,
    medicalSelected,
    halfDaySelected,
    maternityHelp,
    balances,
    loading,
    saving,
    uploadingAttachment,
    error,
    updateField,
    handleAttachmentChange,
    removeAttachment,
    clearAttachments,
    handleSubmit,
    handleCancel,
  } = useLeaveForm();

  const leaveDaysReadOnly = maternitySelected || halfDaySelected;

  return (
    <>
      <Breadcrumb pageName="Request Leave" />
      <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden sm:space-y-6">
        <PageCard
          title="Create Leave Request"
          subtitle="Submit a new leave request for approval. Paid leave uses your casual and sick balances; LOP applies only after both are finished. Maternity is a separate paid entitlement for female employees. Work from home does not reduce leave balances. Medical leave requires a supporting document. Half-day leave counts as 0.5 day."
          bodyClassName="p-5 sm:p-6"
        >
          {loading ? (
            <p className="text-theme-sm text-gray-500">Loading form…</p>
          ) : null}

          {!loading ? (
            <form
              onSubmit={handleSubmit}
              noValidate
              className={FORM_STACK_CLASS}
            >
              <LeaveBalancePanel
                balances={balances}
                leaveType={form.leaveType}
                leaveDays={form.leaveDays}
                title="Your Leave Balance"
              />

              <div className={FORM_GRID_CLASS}>
                <div>
                  <label className={LABEL_CLASS}>
                    Employee ID <RequiredMark />
                  </label>
                  <input
                    type="text"
                    value={employees[0]?.id || form.employeeId || ""}
                    className={INPUT_CLASS}
                    disabled
                    readOnly
                  />
                  <FieldError message={fieldErrors.employeeId} />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Leave Type <RequiredMark />
                  </label>
                  <SelectField
                    value={form.leaveType}
                    onChange={(nextValue) => updateField("leaveType", nextValue)}
                    ariaLabel="Leave type"
                    hasError={Boolean(fieldErrors.leaveType)}
                    options={availableLeaveTypes.map((type) => ({
                      value: type,
                      label: type,
                    }))}
                  />
                  <FieldError message={fieldErrors.leaveType} />
                </div>

                {maternitySelected ? (
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>
                      Expected Delivery Date <RequiredMark />
                    </label>
                    <DateField
                      value={form.expectedDeliveryDate}
                      onChange={(nextValue) =>
                        updateField("expectedDeliveryDate", nextValue)
                      }
                      ariaLabel="Expected delivery date"
                      hasError={Boolean(fieldErrors.expectedDeliveryDate)}
                      placeholder="Select date"
                    />
                    <p className="mt-1.5 text-theme-xs text-gray-500">
                      {maternityHelp}
                    </p>
                    <FieldError message={fieldErrors.expectedDeliveryDate} />
                  </div>
                ) : null}

                {!maternitySelected ? (
                  <div>
                    <label className={LABEL_CLASS}>
                      Duration <RequiredMark />
                    </label>
                    <SelectField
                      value={form.duration}
                      onChange={(nextValue) =>
                        updateField("duration", nextValue)
                      }
                      ariaLabel="Leave duration"
                      hasError={Boolean(fieldErrors.duration)}
                      options={LEAVE_DURATIONS}
                    />
                    <FieldError message={fieldErrors.duration} />
                  </div>
                ) : null}

                {halfDaySelected ? (
                  <div>
                    <label className={LABEL_CLASS}>
                      Half-day session <RequiredMark />
                    </label>
                    <SelectField
                      value={form.halfDaySession}
                      onChange={(nextValue) =>
                        updateField("halfDaySession", nextValue)
                      }
                      ariaLabel="Half-day session"
                      hasError={Boolean(fieldErrors.halfDaySession)}
                      options={HALF_DAY_SESSIONS}
                    />
                    <FieldError message={fieldErrors.halfDaySession} />
                  </div>
                ) : null}

                <div>
                  <label className={LABEL_CLASS}>
                    {halfDaySelected ? "Leave Date" : "Start Date"}{" "}
                    <RequiredMark />
                  </label>
                  <DateField
                    value={form.startDate}
                    onChange={(nextValue) =>
                      updateField("startDate", nextValue)
                    }
                    ariaLabel={halfDaySelected ? "Leave date" : "Start date"}
                    hasError={Boolean(fieldErrors.startDate)}
                    disabled={maternitySelected}
                    placeholder="Select date"
                  />
                  <FieldError message={fieldErrors.startDate} />
                </div>

                {!halfDaySelected ? (
                  <div>
                    <label className={LABEL_CLASS}>
                      End Date <RequiredMark />
                    </label>
                    <DateField
                      value={form.endDate}
                      onChange={(nextValue) =>
                        updateField("endDate", nextValue)
                      }
                      ariaLabel="End date"
                      hasError={Boolean(fieldErrors.endDate)}
                      disabled={maternitySelected}
                      placeholder="Select date"
                    />
                    <FieldError message={fieldErrors.endDate} />
                  </div>
                ) : null}

                <div>
                  <label className={LABEL_CLASS}>
                    Number of Leave Days <RequiredMark />
                  </label>
                  <input
                    type="text"
                    value={form.leaveDays}
                    onChange={(event) =>
                      updateField("leaveDays", event.target.value)
                    }
                    className={
                      fieldErrors.leaveDays ? INPUT_ERROR_CLASS : INPUT_CLASS
                    }
                    placeholder={
                      maternitySelected
                        ? "182 days (auto)"
                        : halfDaySelected
                          ? "0.5"
                          : "Auto-calculated from dates"
                    }
                    disabled={leaveDaysReadOnly}
                    readOnly={leaveDaysReadOnly}
                  />
                  <FieldError message={fieldErrors.leaveDays} />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  Leave Reason <RequiredMark />
                </label>
                <textarea
                  rows={4}
                  value={form.reason}
                  onChange={(event) =>
                    updateField("reason", event.target.value)
                  }
                  className={
                    fieldErrors.reason
                      ? `${TEXTAREA_CLASS} border-error-500`
                      : TEXTAREA_CLASS
                  }
                  placeholder={
                    halfDaySelected
                      ? "e.g. medical appointment, personal errand"
                      : "Reason for leave"
                  }
                />
                <FieldError message={fieldErrors.reason} />
              </div>

              {medicalSelected ? (
                <div>
                  <label className={LABEL_CLASS}>
                    Medical Documents <RequiredMark />
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*,.pdf,application/pdf"
                      multiple
                      onChange={handleAttachmentChange}
                      disabled={
                        uploadingAttachment ||
                        saving ||
                        (form.attachments?.length || 0) >= MAX_MEDICAL_ATTACHMENTS
                      }
                      className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-600 disabled:opacity-60"
                    />
                    <p className="text-theme-xs text-gray-500">
                      {uploadingAttachment
                        ? "Uploading documents…"
                        : `Required for medical leave. Select one or more PDF/image files — max ${MAX_MEDICAL_ATTACHMENTS} files, 5MB each.`}
                    </p>
                    {(form.attachments || []).length > 0 ? (
                      <ul className="space-y-2">
                        {form.attachments.map((file) => (
                          <li
                            key={file.url}
                            className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                          >
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="min-w-0 flex-1 truncate text-theme-sm font-medium text-brand-500 hover:text-brand-600"
                            >
                              {attachmentFileLabel(file.url, file.name) ||
                                "View uploaded document"}
                            </a>
                            <button
                              type="button"
                              onClick={() => removeAttachment(file.url)}
                              disabled={uploadingAttachment || saving}
                              className="text-theme-sm font-medium text-error-600 hover:text-error-700 disabled:opacity-60"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {(form.attachments || []).length > 1 ? (
                      <button
                        type="button"
                        onClick={clearAttachments}
                        disabled={uploadingAttachment || saving}
                        className="text-theme-sm font-medium text-error-600 hover:text-error-700 disabled:opacity-60"
                      >
                        Remove all
                      </button>
                    ) : null}
                  </div>
                  <FieldError message={fieldErrors.attachments} />
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-error-500 bg-error-50 p-4">
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="submit"
                  disabled={saving || uploadingAttachment}
                  className="w-full rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
                >
                  {saving ? "Submitting…" : "Submit Request"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving || uploadingAttachment}
                  className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-60 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </PageCard>
      </div>
    </>
  );
}

export default LeaveFormPage;
