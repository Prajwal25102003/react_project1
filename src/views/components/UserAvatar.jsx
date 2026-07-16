import { getNameInitials } from "../../utils/nameInitials.js";
import { cn } from "../../utils/cn.js";

const SIZE_CLASS = {
  sm: "h-10 w-10 text-theme-sm",
  md: "h-11 w-11 text-theme-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-20 w-20 text-xl",
};

/**
 * Shows a profile image when `src` is set; otherwise name initials.
 * Avatar image is optional everywhere in EMS.
 */
function UserAvatar({
  src,
  name = "",
  alt,
  size = "sm",
  className = "",
}) {
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.sm;
  const label = alt || name || "User";
  const hasImage = Boolean(src && String(src).trim());

  if (hasImage) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-full border border-gray-200 bg-gray-100",
          sizeClass,
          className,
        )}
      >
        <img
          src={src}
          alt={label}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border border-brand-100 bg-brand-50 font-medium text-brand-500",
        sizeClass,
        className,
      )}
      aria-label={label}
      title={label}
    >
      {getNameInitials(name)}
    </div>
  );
}

export default UserAvatar;
