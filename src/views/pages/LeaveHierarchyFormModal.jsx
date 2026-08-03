import ModalShell from "../components/ModalShell.jsx";
import { FieldError, RequiredMark } from "../components/forms/FormHelpers.jsx";
import SelectField from "../components/forms/SelectField.jsx";
import { PlusIcon } from "../icons/ActionIcons.jsx";
import {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  approverTypeSelectValue,
} from "../../models/leaveApprovalHierarchyModel.js";
import {
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
  onClose,
  onChange,
  onStepChange,
  onAddStep,
  canAddStep = true,
  stepApproverOptions = [],
  onRemoveStep,
  onMoveStep,
  onSubmit,
}) {
  if (!open || !hierarchy) return null;

  return (
    <ModalShell
      onClose={onClose}
      title="Edit approval hierarchy"
      description={
        CATEGORY_DESCRIPTIONS[hierarchy.category] ||
        `Configure the approval chain for ${CATEGORY_LABELS[hierarchy.category] || hierarchy.category}.`
      }
      panelClassName="relative mx-auto my-6 flex max-h-[calc(100vh-6rem)] w-full min-w-0 max-w-[min(600px,calc(100vw-4rem))] flex-col overflow-hidden rounded-3xl bg-white p-5 sm:p-6"
    >
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={onSubmit}
        noValidate
      >
        <div className="shrink-0 space-y-4 px-1">
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
              maxLength={120}
            />
            <FieldError message={fieldErrors.name} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-700">
              Approval steps
              <RequiredMark />
            </p>
            <button
              type="button"
              onClick={onAddStep}
              disabled={!canAddStep}
              title={
                canAddStep
                  ? "Add step"
                  : "All allowed approver types are already used"
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PlusIcon />
              Add step
            </button>
          </div>
          <FieldError message={fieldErrors.steps} />
        </div>

        {/* Cap at ~3 step cards; extra steps scroll inside this area only. */}
        <div className="custom-scrollbar mt-3 max-h-[25.5rem] min-h-0 space-y-3 overflow-y-auto overscroll-contain px-1 pb-1">
          {(form.steps || []).map((step, index) => {
            const stepError = fieldErrors[`step-${index}`];
            const typeOptions = stepApproverOptions[index] || [];
            return (
              <div
                key={`step-${index}`}
                className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5"
              >
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
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
                      options={typeOptions}
                    />
                  </div>

                  {step.approverKind === "department_head" ? (
                    <div className="flex items-end">
                      <p className="pb-3 text-theme-sm text-gray-500">
                        Uses the requester&apos;s current team lead
                        (department head). If the head is reassigned, the new
                        team lead approves pending requests at this step.
                      </p>
                    </div>
                  ) : null}
                </div>
                <FieldError message={stepError} />
              </div>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center justify-center gap-3 border-t border-gray-100 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save hierarchy"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export default LeaveHierarchyFormModal;
