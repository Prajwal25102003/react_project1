import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  EMPTY_SIGN_IN_FORM,
  validateSignInForm,
} from "../models/authModel.js";
import { useAuth } from "./authContext.jsx";

function useToggle(initial = false) {
  const [value, setValue] = useState(initial);

  return {
    value,
    toggle: () => setValue((current) => !current),
    setValue,
  };
}

function usePasswordToggle() {
  const visibility = useToggle(false);

  return {
    showPassword: visibility.value,
    onToggle: visibility.toggle,
  };
}

export function useSignInForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const password = usePasswordToggle();
  const [form, setForm] = useState({ ...EMPTY_SIGN_IN_FORM });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validation = validateSignInForm(form);
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      setError("");
      return;
    }

    setError("");
    setFieldErrors({});
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    password,
    form,
    fieldErrors,
    error,
    submitting,
    updateField,
    handleSubmit,
  };
}
