import { useParams } from "react-router-dom";
import { useDepartmentForm } from "../../controllers/departmentsController.js";
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

function DepartmentFormPage() {
  const { id } = useParams();
  const {
    isEdit,
    form,
    fieldErrors,
    headCandidates,
    loading,
    saving,
    error,
    updateField,
    handleSubmit,
    handleCancel,
  } = useDepartmentForm(id);

  const pageName = isEdit ? "Edit Department" : "Add Department";
  const candidates = headCandidates || [];
  const headOptions = [
    { value: "", label: "No head assigned" },
    ...candidates.map((employee) => ({
      value: employee.id,
      label: `${employee.name} (${employee.id})`,
    })),
  ];

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
                  {isEdit ? (
                    <>
                      <SelectField
                        value={form.headEmployeeId}
                        onChange={(nextValue) =>
                          updateField("headEmployeeId", nextValue)
                        }
                        ariaLabel="Department head"
                        placeholder="No head assigned"
                        hasError={Boolean(fieldErrors.headEmployeeId)}
                        options={headOptions}
                      />
                      <p className="mt-1.5 text-theme-xs text-gray-500">
                        Only employees in this department can be selected as
                        head.
                        {candidates.length === 0
                          ? " Add employees to this department first."
                          : ""}
                      </p>
                      <FieldError message={fieldErrors.headEmployeeId} />
                    </>
                  ) : (
                    <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-theme-sm text-gray-500">
                      Assign a head after creating the department and adding
                      employees to it.
                    </p>
                  )}
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
