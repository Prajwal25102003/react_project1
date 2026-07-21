import ModalShell from "../components/ModalShell.jsx";
import { FieldError, RequiredMark } from "../components/forms/FormHelpers.jsx";
import SelectField from "../components/forms/SelectField.jsx";
import { HOLIDAY_TYPES } from "../../models/holidaysModel.js";
import {
  FORM_GRID_CLASS,
  FORM_STACK_CLASS,
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
  LABEL_CLASS,
  TEXTAREA_CLASS,
} from "../../models/formLayoutModel.js";

function HolidayFormModal({
  open,
  isEdit,
  form,
  fieldErrors,
  error,
  saving,
  onClose,
  onChange,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <ModalShell
      onClose={onClose}
      title={isEdit ? "Edit Holiday" : "Add Holiday"}
      description={
        isEdit
          ? "Update holiday details for the calendar."
          : "Add a holiday to the calendar."
      }
    >
      <form onSubmit={onSubmit} noValidate className="px-2">
        <div className={FORM_STACK_CLASS}>
          {error ? (
            <p className="text-theme-sm text-error-600">{error}</p>
          ) : null}

          <div className={FORM_GRID_CLASS}>
            <div>
              <label className={LABEL_CLASS} htmlFor="holiday-name">
                Holiday Name
                <RequiredMark />
              </label>
              <input
                id="holiday-name"
                value={form.name}
                onChange={(event) => onChange("name", event.target.value)}
                className={fieldErrors.name ? INPUT_ERROR_CLASS : INPUT_CLASS}
                placeholder="Independence Day"
              />
              <FieldError message={fieldErrors.name} />
            </div>

            <div>
              <label className={LABEL_CLASS} htmlFor="holiday-date">
                Date
                <RequiredMark />
              </label>
              <input
                id="holiday-date"
                type="date"
                value={form.date}
                onChange={(event) => onChange("date", event.target.value)}
                className={fieldErrors.date ? INPUT_ERROR_CLASS : INPUT_CLASS}
              />
              <FieldError message={fieldErrors.date} />
            </div>

            <div>
              <label className={LABEL_CLASS} htmlFor="holiday-type">
                Type
                <RequiredMark />
              </label>
              <SelectField
                value={form.type}
                onChange={(value) => onChange("type", value)}
                ariaLabel="Holiday type"
                hasError={Boolean(fieldErrors.type)}
                options={HOLIDAY_TYPES.map((value) => ({
                  value,
                  label: value,
                }))}
              />
              <FieldError message={fieldErrors.type} />
            </div>

            <div className="sm:col-span-2">
              <label className={LABEL_CLASS} htmlFor="holiday-description">
                Description
              </label>
              <textarea
                id="holiday-description"
                rows={3}
                value={form.description}
                onChange={(event) =>
                  onChange("description", event.target.value)
                }
                className={TEXTAREA_CLASS}
                placeholder="Public Holiday"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Holiday"}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

export default HolidayFormModal;
