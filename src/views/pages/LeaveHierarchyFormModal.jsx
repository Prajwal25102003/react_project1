import ModalShell from "../components/ModalShell.jsx";
import { FieldError, RequiredMark } from "../components/forms/FormHelpers.jsx";
import SelectField from "../components/forms/SelectField.jsx";
import { PlusIcon } from "../icons/ActionIcons.jsx";
import {
  APPROVER_KIND_OPTIONS,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  approverTypeSelectValue,
} from "../../models/leaveApprovalHierarchyModel.js";
import {
  FORM_STACK_CLASS,
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
  LABEL_CLASS,
} from "../../models/formLayoutModel.js";

function LeaveHierarchyFormModal({
  open,
  hierarchy,
  form,
  fieldErrors,
  error,
  saving,
  employees,
  onClose,
  onChange,
  onStepChange,
  onAddStep,
  onRemoveStep,
  onMoveStep,
  onSubmit,
}) {
  if (!open || !hierarchy) return null;

  const employeeOptions = (employees || []).map((employee) => ({
    value: employee.id,
    label: `${employee.name} (${employee.id})`,
  }));

  return (
    <ModalShell
      onClose={onClose}
      title="Edit approval hierarchy"
      description={
        CATEGORY_DESCRIPTIONS[hierarchy.category] ||
        `Configure the approval chain for ${CATEGORY_LABELS[hierarchy.category] || hierarchy.category}.`
      }
    >
      <form onSubmit={onSubmit} noValidate className="px-2">
        <div className={FORM_STACK_CLASS}>
          {error ? (
            <p className="text-theme-sm text-error-600">{error}</p>
          ) : null}

          <div>
            <label className={LABEL_CLASS} htmlFor="hierarchy-name">
              Name
              <RequiredMark />
            </label>
            <input
              id="hierarchy-name"
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
              className={fieldErrors.name ? INPUT_ERROR_CLASS : INPUT_CLASS}
              placeholder="Employee leave"
            />
            <FieldError message={fieldErrors.name} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-700">
                Approval steps
                <RequiredMark />
              </p>
              <button
                type="button"
                onClick={onAddStep}
                title="Add step"
                aria-label="Add step"
                className="inline-flex items-center justify-center rounded-md p-0.5 transition hover:opacity-80 hover:scale-105"
              >
                <PlusIcon />
              </button>
            </div>
            <FieldError message={fieldErrors.steps} />

            {(form.steps || []).map((step, index) => {
              const stepError = fieldErrors[`step-${index}`];
              return (
                <div
                  key={`step-${index}`}
                  className="rounded-xl border border-gray-200 bg-gray-50/60 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-theme-sm font-medium text-gray-800">
                      Step {index + 1}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onMoveStep(index, -1)}
                        disabled={index === 0}
                        className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveStep(index, 1)}
                        disabled={index === form.steps.length - 1}
                        className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveStep(index)}
                        disabled={form.steps.length <= 1}
                        className="rounded-lg border border-error-200 bg-white px-2.5 py-1 text-theme-xs font-medium text-error-600 shadow-theme-xs hover:bg-error-50 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={LABEL_CLASS}>Approver type</label>
                      <SelectField
                        value={approverTypeSelectValue(step)}
                        onChange={(value) =>
                          onStepChange(index, "approverKind", value)
                        }
                        ariaLabel={`Step ${index + 1} approver type`}
                        hasError={Boolean(stepError)}
                        options={APPROVER_KIND_OPTIONS}
                      />
                    </div>

                    {step.approverKind === "employee" ? (
                      <div>
                        <label className={LABEL_CLASS}>Employee</label>
                        <SelectField
                          value={step.approverEmployeeId || ""}
                          onChange={(value) =>
                            onStepChange(index, "approverEmployeeId", value)
                          }
                          ariaLabel={`Step ${index + 1} employee`}
                          hasError={Boolean(stepError)}
                          options={employeeOptions}
                          placeholder="Select employee"
                        />
                      </div>
                    ) : null}

                    {step.approverKind === "department_head" ? (
                      <div className="flex items-end">
                        <p className="pb-3 text-theme-sm text-gray-500">
                          Uses the requester&apos;s current department head. If
                          the head is reassigned, the new head approves pending
                          requests at this step.
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <FieldError message={stepError} />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save hierarchy"}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

export default LeaveHierarchyFormModal;
