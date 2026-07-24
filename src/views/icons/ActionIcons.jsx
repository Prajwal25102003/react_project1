import checkSvg from "./assets/check.svg";
import crossSvg from "./assets/cross.svg";
import exportSvg from "./assets/export.svg";
import eyeSvg from "./assets/eye.svg";
import pencilSvg from "./assets/pencil.svg";
import personSvg from "./assets/person.svg";
import plusSvg from "./assets/plus.svg";
import trashSvg from "./assets/trash.svg";

const ICON_SIZE = 26;
const ADD_ICON_SIZE = 30;

const ACTION_ICON_SRC = {
  pencil: pencilSvg,
  eye: eyeSvg,
  trash: trashSvg,
  "check-circle": checkSvg,
  "x-circle": crossSvg,
  export: exportSvg,
  plus: plusSvg,
  person: personSvg,
};

export function ActionIcon({ name, size = ICON_SIZE, className }) {
  const src = ACTION_ICON_SRC[name];
  if (!src) return null;

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
      style={{ display: "block", flexShrink: 0 }}
    />
  );
}

/** Purple plus — default “Add” control (screenshot: Plus). */
export function PlusIcon({ size = ADD_ICON_SIZE, className }) {
  return <ActionIcon name="plus" size={size} className={className} />;
}

/** Person + plus — “Add employee” (screenshot: Person Plus). */
export function PersonPlusIcon({ size = ADD_ICON_SIZE, className }) {
  const personSize = Math.round(size * 0.92);
  const plusSize = Math.round(size * 0.72);
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        lineHeight: 0,
      }}
      aria-hidden="true"
    >
      <ActionIcon name="person" size={personSize} />
      <ActionIcon name="plus" size={plusSize} />
    </span>
  );
}

export function PencilIcon(props) {
  return <ActionIcon name="pencil" {...props} />;
}

export function EyeIcon(props) {
  return <ActionIcon name="eye" {...props} />;
}

export function TrashBinIcon(props) {
  return <ActionIcon name="trash" {...props} />;
}

export function CheckCircleIcon(props) {
  return <ActionIcon name="check-circle" {...props} />;
}

export function XCircleIcon(props) {
  return <ActionIcon name="x-circle" {...props} />;
}

export function ExportIcon(props) {
  return <ActionIcon name="export" {...props} />;
}
