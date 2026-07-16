import { useParams } from "react-router-dom";
import { useAttendanceForm } from "../../controllers/attendanceController.js";
import {
  ATTENDANCE_STATUSES,
  formatWorkingHoursLabel,
} from "../../models/attendanceModel.js";
import {
  FORM_GRID_CLASS,
  FORM_STACK_CLASS,
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
  LABEL_CLASS,
} from "../../models/formLayoutModel.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import PageCard from "../components/PageCard.jsx";
import { FieldError, RequiredMark } from "../components/forms/FormHelpers.jsx";
import SelectField from "../components/forms/SelectField.jsx";

function AttendanceFormPage() {
  const { id } = useParams();
  const {
    isEdit,
    form,
    fieldErrors,
    employees,
    loading,
    saving,
    error,
    updateField,
    handleSubmit,
    handleCancel,
  } = useAttendanceForm(id);

  const pageName = isEdit ? "Edit Attendance" : "Mark Attendance";

  return (
    <>
      <Breadcrumb pageName={pageName} />
      <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden sm:space-y-6">
        <PageCard
          title={pageName}
          subtitle={
            isEdit
              ? "Update an attendance record."
              : "Mark attendance for an employee."
          }
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
              {isEdit ? (
                <div>
                  <label className={LABEL_CLASS}>Attendance ID</label>
                  <input
                    type="text"
                    value={id}
                    disabled
                    className={INPUT_CLASS}
                  />
                </div>
              ) : null}

              <div className={FORM_GRID_CLASS}>
                <div>
                  <label className={LABEL_CLASS}>
                    Employee <RequiredMark />
                  </label>
                  <SelectField
                    value={form.employeeId}
                    onChange={(nextValue) =>
                      updateField("employeeId", nextValue)
                    }
                    ariaLabel="Employee"
                    placeholder="Select employee"
                    hasError={Boolean(fieldErrors.employeeId)}
                    options={[
                      { value: "", label: "Select employee" },
                      ...employees.map((employee) => ({
                        value: employee.id,
                        label: employee.name,
                      })),
                    ]}
                  />
                  <FieldError message={fieldErrors.employeeId} />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Date <RequiredMark />
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      updateField("date", event.target.value)
                    }
                    className={
                      fieldErrors.date ? INPUT_ERROR_CLASS : INPUT_CLASS
                    }
                  />
                  <FieldError message={fieldErrors.date} />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Check-In Time <RequiredMark />
                  </label>
                  <input
                    type="text"
                    value={form.checkIn}
                    onChange={(event) =>
                      updateField("checkIn", event.target.value)
                    }
                    className={
                      fieldErrors.checkIn ? INPUT_ERROR_CLASS : INPUT_CLASS
                    }
                    placeholder="09:00 AM"
                  />
                  <FieldError message={fieldErrors.checkIn} />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Check-Out Time <RequiredMark />
                  </label>
                  <input
                    type="text"
                    value={form.checkOut}
                    onChange={(event) =>
                      updateField("checkOut", event.target.value)
                    }
                    className={
                      fieldErrors.checkOut ? INPUT_ERROR_CLASS : INPUT_CLASS
                    }
                    placeholder="06:00 PM"
                  />
                  <FieldError message={fieldErrors.checkOut} />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Attendance Status <RequiredMark />
                  </label>
                  <SelectField
                    value={form.status}
                    onChange={(nextValue) => updateField("status", nextValue)}
                    ariaLabel="Attendance status"
                    hasError={Boolean(fieldErrors.status)}
                    options={ATTENDANCE_STATUSES.map((status) => ({
                      value: status,
                      label: status,
                    }))}
                  />
                  <FieldError message={fieldErrors.status} />
                </div>

                <div>
                  <label className={LABEL_CLASS}>Working Hours</label>
                  <input
                    type="text"
                    value={
                      form.workingHours === ""
                        ? ""
                        : formatWorkingHoursLabel(form.workingHours)
                    }
                    readOnly
                    className={`${INPUT_CLASS} bg-gray-50 text-gray-700`}
                    placeholder="Auto from check-in/out"
                  />
                  <p className="mt-1.5 text-theme-xs text-gray-500">
                    Calculated automatically from check-in and check-out.
                  </p>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-error-500 bg-error-50 p-4">
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
                >
                  {saving
                    ? "Saving…"
                    : isEdit
                      ? "Save Changes"
                      : "Mark Attendance"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-60"
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

export default AttendanceFormPage;
