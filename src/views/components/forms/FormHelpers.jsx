import { FIELD_ERROR_CLASS } from "../../../models/formLayoutModel.js";

export function RequiredMark() {
  return <span className="text-error-500">*</span>;
}

export function FieldError({ message }) {
  if (!message) return null;
  return <p className={FIELD_ERROR_CLASS}>{message}</p>;
}
