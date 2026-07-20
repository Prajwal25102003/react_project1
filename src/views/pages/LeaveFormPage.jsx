import { useLeaveForm } from "../../controllers/leaveRequestsController.js";
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
    maternityHelp,
    balances,
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
          subtitle="Submit a new leave request for approval. Paid quota is 1 casual + 1 sick leave. Maternity is a separate paid entitlement for female employees."
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

                <div>
                  <label className={LABEL_CLASS}>
                    Start Date <RequiredMark />
                  </label>
                  <DateField
                    value={form.startDate}
                    onChange={(nextValue) =>
                      updateField("startDate", nextValue)
                    }
                    ariaLabel="Start date"
                    hasError={Boolean(fieldErrors.startDate)}
                    disabled={maternitySelected}
                    placeholder="Select date"
                  />
                  <FieldError message={fieldErrors.startDate} />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    End Date <RequiredMark />
                  </label>
                  <DateField
                    value={form.endDate}
                    onChange={(nextValue) => updateField("endDate", nextValue)}
                    ariaLabel="End date"
                    hasError={Boolean(fieldErrors.endDate)}
                    disabled={maternitySelected}
                    placeholder="Select date"
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
                    placeholder={
                      maternitySelected
                        ? "182 days (auto)"
                        : "Auto-calculated from dates"
                    }
                    disabled={maternitySelected}
                    readOnly={maternitySelected}
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
