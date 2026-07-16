import { useLeaveForm } from "../../controllers/leaveRequestsController.js";
import { LEAVE_TYPES } from "../../models/leaveRequestsModel.js";
import {
  FORM_GRID_CLASS,
  FORM_STACK_CLASS,
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
  LABEL_CLASS,
  TEXTAREA_CLASS,
} from "../../models/formLayoutModel.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import PageCard from "../components/PageCard.jsx";
import { FieldError, RequiredMark } from "../components/forms/FormHelpers.jsx";
import SelectField from "../components/forms/SelectField.jsx";

function LeaveFormPage() {
  const {
    form,
    fieldErrors,
    employees,
    loading,
    saving,
    error,
    updateField,
    handleSubmit,
    handleCancel,
  } = useLeaveForm();

  return (
    <>
      <Breadcrumb pageName="Request Leave" />
      <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden sm:space-y-6">
        <PageCard
          title="Create Leave Request"
          subtitle="Submit a new leave request for approval."
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
              <div className={FORM_GRID_CLASS}>
                <div>
                  <label className={LABEL_CLASS}>
                    Employee <RequiredMark />
                  </label>
                  <input
                    type="text"
                    value={employees[0]?.name || "You"}
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
                    options={LEAVE_TYPES.map((type) => ({
                      value: type,
                      label: type,
                    }))}
                  />
                  <FieldError message={fieldErrors.leaveType} />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Start Date <RequiredMark />
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      updateField("startDate", event.target.value)
                    }
                    className={
                      fieldErrors.startDate ? INPUT_ERROR_CLASS : INPUT_CLASS
                    }
                  />
                  <FieldError message={fieldErrors.startDate} />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    End Date <RequiredMark />
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) =>
                      updateField("endDate", event.target.value)
                    }
                    className={
                      fieldErrors.endDate ? INPUT_ERROR_CLASS : INPUT_CLASS
                    }
                  />
                  <FieldError message={fieldErrors.endDate} />
                </div>

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
                    placeholder="Auto-calculated from dates"
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
                  placeholder="Reason for leave"
                />
                <FieldError message={fieldErrors.reason} />
              </div>

              {error ? (
                <div className="rounded-xl border border-error-500 bg-error-50 p-4">
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
                >
                  {saving ? "Submitting…" : "Submit Request"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
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
