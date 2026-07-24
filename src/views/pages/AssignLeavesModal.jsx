import ModalShell from "../components/ModalShell.jsx";
import { FieldError, RequiredMark } from "../components/forms/FormHelpers.jsx";
import SelectField from "../components/forms/SelectField.jsx";
import {
  FORM_GRID_CLASS,
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
  LABEL_CLASS,
} from "../../models/formLayoutModel.js";

function AssignLeavesModal({
  open,
  form,
  fieldErrors,
  error,
  assigning,
  departments,
  scopes,
  modes,
  employees,
  employeeSearch,
  onEmployeeSearchChange,
  onClose,
  onFieldChange,
  onToggleEmployee,
  onSelectAllEmployees,
  onClearEmployees,
  onSubmit,
}) {
  if (!open) return null;

  const selected = new Set(form.employeeIds || []);
  const showEmployeePicker =
    form.scope === "department" || form.scope === "custom";

  return (
    <ModalShell
      onClose={onClose}
      title="Assign Leaves"
      description="Set or add casual and sick leave for all staff, a department, or selected people. Admin is never updated."
      panelClassName="relative mx-auto flex max-h-[calc(100vh-2.5rem)] w-full min-w-0 max-w-[min(720px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl bg-white p-5 lg:p-8"
    >
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-1">
          {error ? (
            <p className="text-theme-sm text-error-600">{error}</p>
          ) : null}

          <div className={FORM_GRID_CLASS}>
            <div>
              <label className={LABEL_CLASS} htmlFor="assign-scope">
                Apply to
                <RequiredMark />
              </label>
              <SelectField
                value={form.scope}
                onChange={(value) => onFieldChange("scope", value)}
                ariaLabel="Assign scope"
                hasError={Boolean(fieldErrors.scope)}
                options={scopes}
              />
              <FieldError message={fieldErrors.scope} />
            </div>

            <div>
              <label className={LABEL_CLASS} htmlFor="assign-mode">
                Mode
                <RequiredMark />
              </label>
              <SelectField
                value={form.mode}
                onChange={(value) => onFieldChange("mode", value)}
                ariaLabel="Assign mode"
                hasError={Boolean(fieldErrors.mode)}
                options={modes}
              />
              <FieldError message={fieldErrors.mode} />
              <p className="mt-1.5 text-theme-xs text-gray-500">
                {form.mode === "add"
                  ? "Days are added on top of current balances."
                  : "Days replace the current casual and sick balances."}
              </p>
            </div>
          </div>

          {form.scope === "department" ? (
            <div>
              <label className={LABEL_CLASS} htmlFor="assign-department">
                Department
                <RequiredMark />
              </label>
              <SelectField
                value={form.departmentId}
                onChange={(value) => onFieldChange("departmentId", value)}
                ariaLabel="Department"
                placeholder="Select department"
                hasError={Boolean(fieldErrors.departmentId)}
                options={[
                  { value: "", label: "Select department" },
                  ...departments.map((department) => ({
                    value: department.id,
                    label: department.name,
                  })),
                ]}
              />
              <FieldError message={fieldErrors.departmentId} />
            </div>
          ) : null}

          {showEmployeePicker ? (
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label className={LABEL_CLASS} htmlFor="assign-employee-search">
                  Employees
                  <RequiredMark />
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onSelectAllEmployees}
                    disabled={assigning || employees.length === 0}
                    className="text-theme-xs font-medium text-brand-500 hover:text-brand-600 disabled:opacity-50"
                  >
                    Select all
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={onClearEmployees}
                    disabled={assigning || selected.size === 0}
                    className="text-theme-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <input
                id="assign-employee-search"
                type="search"
                value={employeeSearch}
                onChange={(event) => onEmployeeSearchChange(event.target.value)}
                className={INPUT_CLASS}
                placeholder={
                  form.scope === "department"
                    ? "Search employees in this department…"
                    : "Search by name, ID, or department…"
                }
                disabled={assigning}
              />
              <div className="no-scrollbar mt-2 max-h-[min(11rem,22vh)] overflow-y-auto rounded-xl border border-gray-200">
                {form.scope === "department" && !form.departmentId ? (
                  <p className="px-3 py-4 text-theme-sm text-gray-500">
                    Select a department to see employees.
                  </p>
                ) : employees.length === 0 ? (
                  <p className="px-3 py-4 text-theme-sm text-gray-500">
                    No employees match this search.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {employees.map((employee) => {
                      const checked = selected.has(employee.id);
                      return (
                        <li key={employee.id}>
                          <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => onToggleEmployee(employee.id)}
                              disabled={assigning}
                              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-theme-sm font-medium text-gray-800">
                                {employee.name}
                              </span>
                              <span className="block text-theme-xs text-gray-500">
                                {employee.id}
                                {employee.department
                                  ? ` · ${employee.department}`
                                  : ""}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <p className="mt-1.5 text-theme-xs text-gray-500">
                {selected.size} selected
                {form.scope === "department"
                  ? " (Select all or pick a subset)"
                  : ""}
              </p>
              <FieldError message={fieldErrors.employeeIds} />
            </div>
          ) : null}

          <div className={FORM_GRID_CLASS}>
            <div>
              <label className={LABEL_CLASS} htmlFor="assign-casual">
                Casual leave (days)
                <RequiredMark />
              </label>
              <input
                id="assign-casual"
                type="number"
                min="0"
                step="1"
                value={form.casualLeaveBalance}
                onChange={(event) =>
                  onFieldChange("casualLeaveBalance", event.target.value)
                }
                className={
                  fieldErrors.casualLeaveBalance
                    ? INPUT_ERROR_CLASS
                    : INPUT_CLASS
                }
                placeholder="e.g. 6"
                disabled={assigning}
              />
              <FieldError message={fieldErrors.casualLeaveBalance} />
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="assign-sick">
                Sick leave (days)
                <RequiredMark />
              </label>
              <input
                id="assign-sick"
                type="number"
                min="0"
                step="1"
                value={form.sickLeaveBalance}
                onChange={(event) =>
                  onFieldChange("sickLeaveBalance", event.target.value)
                }
                className={
                  fieldErrors.sickLeaveBalance ? INPUT_ERROR_CLASS : INPUT_CLASS
                }
                placeholder="e.g. 6"
                disabled={assigning}
              />
              <FieldError message={fieldErrors.sickLeaveBalance} />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-100 pt-4">
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={assigning}
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
            >
              {assigning ? "Assigning…" : "Assign leaves"}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

export default AssignLeavesModal;
