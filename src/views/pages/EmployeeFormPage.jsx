import { useParams } from "react-router-dom";
import { useEmployeeForm } from "../../controllers/employeesController.js";
import {
  EMPLOYEE_GENDERS,
  EMPLOYEE_STATUSES,
  MIN_EMPLOYEE_PASSWORD_LENGTH,
} from "../../models/employeesModel.js";
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
import PasswordField from "../components/forms/PasswordField.jsx";
import SelectField from "../components/forms/SelectField.jsx";
import UserAvatar from "../components/UserAvatar.jsx";

function EmployeeFormPage() {
  const { id } = useParams();
  const {
    isEdit,
    form,
    fieldErrors,
    departments,
    loading,
    saving,
    uploadingAvatar,
    error,
    canManageCredentials,
    showPasswordFields,
    showPassword,
    setShowPassword,
    updateField,
    handleAvatarChange,
    clearAvatar,
    handleSubmit,
    handleCancel,
  } = useEmployeeForm(id);

  const pageName = isEdit ? "Edit Employee" : "Add Employee";
  const passwordRequired = !isEdit;

  return (
    <>
      <Breadcrumb pageName={pageName} />

      <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden sm:space-y-6">
        <PageCard
          title={isEdit ? "Edit Employee" : "Create Employee"}
          subtitle={
            isEdit
              ? "Update employee details in the directory."
              : "Add a new employee and create their login for the employee dashboard."
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
                  <label className={LABEL_CLASS}>Employee ID</label>
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
                    Full Name <RequiredMark />
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
                    placeholder="Enter full name"
                  />
                  <FieldError message={fieldErrors.name} />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Email <RequiredMark />
                  </label>
                  <input
                    type="text"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    className={
                      fieldErrors.email ? INPUT_ERROR_CLASS : INPUT_CLASS
                    }
                    placeholder="name@company.com"
                  />
                  <p className="mt-1.5 text-theme-xs text-gray-500">
                    Directory contact email.
                  </p>
                  <FieldError message={fieldErrors.email} />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Phone <RequiredMark />
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    className={
                      fieldErrors.phone ? INPUT_ERROR_CLASS : INPUT_CLASS
                    }
                    placeholder="9876543210"
                  />
                  <FieldError message={fieldErrors.phone} />
                  <p className="mt-1.5 text-theme-xs text-gray-500">
                    Exactly 10 digits. Extra digits are not accepted. +91 is
                    added when saved.
                  </p>
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Gender <RequiredMark />
                  </label>
                  <SelectField
                    value={form.gender}
                    onChange={(nextValue) => updateField("gender", nextValue)}
                    ariaLabel="Gender"
                    hasError={Boolean(fieldErrors.gender)}
                    options={EMPLOYEE_GENDERS.map((gender) => ({
                      value: gender,
                      label: gender,
                    }))}
                  />
                  <FieldError message={fieldErrors.gender} />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Department <RequiredMark />
                  </label>
                  <SelectField
                    value={form.departmentId}
                    onChange={(nextValue) =>
                      updateField("departmentId", nextValue)
                    }
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

                <div>
                  <label className={LABEL_CLASS}>
                    Designation <RequiredMark />
                  </label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(event) =>
                      updateField("designation", event.target.value)
                    }
                    className={
                      fieldErrors.designation ? INPUT_ERROR_CLASS : INPUT_CLASS
                    }
                    placeholder="Job title"
                  />
                  <FieldError message={fieldErrors.designation} />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Joining Date <RequiredMark />
                  </label>
                  <input
                    type="date"
                    value={form.joiningDate}
                    onChange={(event) =>
                      updateField("joiningDate", event.target.value)
                    }
                    className={
                      fieldErrors.joiningDate ? INPUT_ERROR_CLASS : INPUT_CLASS
                    }
                  />
                  <FieldError message={fieldErrors.joiningDate} />
                  <p className="mt-1.5 text-theme-xs text-gray-500">
                    Counts toward New Hires on the dashboard when it falls in
                    the selected period.
                  </p>
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Status <RequiredMark />
                  </label>
                  <SelectField
                    value={form.status}
                    onChange={(nextValue) => updateField("status", nextValue)}
                    ariaLabel="Status"
                    hasError={Boolean(fieldErrors.status)}
                    options={EMPLOYEE_STATUSES.map((status) => ({
                      value: status,
                      label: status,
                    }))}
                  />
                  <FieldError message={fieldErrors.status} />
                </div>

                <div>
                  <label className={LABEL_CLASS}>Avatar</label>
                  <div className="flex flex-wrap items-center gap-4">
                    <UserAvatar
                      src={form.avatar}
                      name={form.name || "Employee"}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={uploadingAvatar || saving}
                        className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-600 disabled:opacity-60"
                      />
                      <p className="text-theme-xs text-gray-500">
                        {uploadingAvatar
                          ? "Uploading image…"
                          : "Optional. Without an image, name initials are shown. JPG, PNG, GIF, WEBP — max 2MB."}
                      </p>
                      {form.avatar ? (
                        <button
                          type="button"
                          onClick={clearAvatar}
                          disabled={uploadingAvatar || saving}
                          className="text-theme-sm font-medium text-error-600 hover:text-error-700 disabled:opacity-60"
                        >
                          Remove image
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <FieldError message={fieldErrors.avatar} />
                </div>
              </div>

              {showPasswordFields ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
                  <h3 className="text-theme-sm font-medium text-gray-800">
                    {isEdit
                      ? "Login credentials"
                      : "Employee dashboard login"}
                  </h3>
                  <p className="mt-1 text-theme-xs text-gray-500">
                    {isEdit
                      ? canManageCredentials
                        ? form.hasLoginAccount
                          ? "Update Gmail or enter a new password to change login credentials. Leave password blank to keep the current password."
                          : "This employee has no login yet. Add a Gmail and password to create their dashboard account."
                        : null
                      : departments.find(
                            (department) => department.id === form.departmentId,
                          )?.name === "Human Resources"
                        ? "Human Resources staff sign in to the HR dashboard with full workforce access."
                        : "Add the Gmail and password the employee will use to sign in to their dashboard."}
                  </p>

                  <div className={`${FORM_GRID_CLASS} mt-4`}>
                    <div>
                      <label className={LABEL_CLASS}>
                        Gmail {passwordRequired ? <RequiredMark /> : null}
                      </label>
                      <input
                        type="text"
                        value={form.gmail}
                        onChange={(event) =>
                          updateField("gmail", event.target.value)
                        }
                        className={
                          fieldErrors.gmail ? INPUT_ERROR_CLASS : INPUT_CLASS
                        }
                        placeholder="name@gmail.com"
                        autoComplete="username"
                      />
                      <p className="mt-1.5 text-theme-xs text-gray-500">
                        Login email for the employee dashboard.
                      </p>
                      <FieldError message={fieldErrors.gmail} />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>
                        Password{" "}
                        {passwordRequired ? <RequiredMark /> : null}
                      </label>
                      <PasswordField
                        value={form.password}
                        onChange={(event) =>
                          updateField("password", event.target.value)
                        }
                        showPassword={showPassword}
                        onToggle={() => setShowPassword((current) => !current)}
                        className={
                          fieldErrors.password ? INPUT_ERROR_CLASS : INPUT_CLASS
                        }
                        placeholder={
                          isEdit && form.hasLoginAccount
                            ? "Leave blank to keep current password"
                            : "Create a password"
                        }
                        autoComplete="new-password"
                      />
                      <p className="mt-1.5 text-theme-xs text-gray-500">
                        At least {MIN_EMPLOYEE_PASSWORD_LENGTH} characters.
                      </p>
                      <FieldError message={fieldErrors.password} />
                    </div>
                  </div>
                </div>
              ) : null}

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
                      : "Create Employee"}
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

export default EmployeeFormPage;
