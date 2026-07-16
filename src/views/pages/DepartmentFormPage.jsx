import { useParams } from "react-router-dom";
import { useDepartmentForm } from "../../controllers/departmentsController.js";
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

function DepartmentFormPage() {
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
  } = useDepartmentForm(id);

  const pageName = isEdit ? "Edit Department" : "Add Department";

  return (
    <>
      <Breadcrumb pageName={pageName} />

      <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden sm:space-y-6">
        <PageCard
          title={isEdit ? "Edit Department" : "Create Department"}
          subtitle={
            isEdit
              ? "Update department details in the organization."
              : "Add a new department to the organization."
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
                  <label className={LABEL_CLASS}>Department ID</label>
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
                    Department Name <RequiredMark />
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    className={
                      fieldErrors.name ? INPUT_ERROR_CLASS : INPUT_CLASS
                    }
                    placeholder="Enter department name"
                  />
                  <FieldError message={fieldErrors.name} />
                </div>

                <div>
                  <label className={LABEL_CLASS}>Department Head</label>
                  <SelectField
                    value={form.headEmployeeId}
                    onChange={(nextValue) =>
                      updateField("headEmployeeId", nextValue)
                    }
                    ariaLabel="Department head"
                    placeholder="No head assigned"
                    hasError={Boolean(fieldErrors.headEmployeeId)}
                    options={[
                      { value: "", label: "No head assigned" },
                      ...employees.map((employee) => ({
                        value: employee.id,
                        label: employee.name,
                      })),
                    ]}
                  />
                  <FieldError message={fieldErrors.headEmployeeId} />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  Description <RequiredMark />
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  className={
                    fieldErrors.description
                      ? `${TEXTAREA_CLASS} border-error-500 focus:border-error-500 focus:ring-error-500/10`
                      : TEXTAREA_CLASS
                  }
                  placeholder="Describe the department's role and responsibilities"
                />
                <FieldError message={fieldErrors.description} />
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
                      : "Create Department"}
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

export default DepartmentFormPage;
