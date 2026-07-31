import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function prefersTouchUi() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

function isOverflowing(el) {
  if (!el) return false;
  return (
    el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
  );
}

/** True when the trigger (or a child) is visually truncated / clamped. */
function hasTruncatedContent(root) {
  if (!root) return false;
  if (isOverflowing(root)) return true;
  for (const el of root.querySelectorAll("*")) {
    if (isOverflowing(el)) return true;
  }
  return false;
}

/**
 * TailAdmin-style tooltip (portal — not clipped by overflow parents).
 * Desktop: hover / focus. Mobile: tap to toggle when enabled.
 *
 * @param {boolean} onlyWhenTruncated - when true (default), only if text overflows
 * @param {boolean} compact - short label tip sized to content and centered on trigger
 */
function HoverTooltip({
  content,
  children,
  className = "",
  onlyWhenTruncated = true,
  compact = false,
}) {
  const tipId = useId();
  const triggerRef = useRef(null);
  const tipRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [truncated, setTruncated] = useState(!onlyWhenTruncated);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: compact ? "auto" : 280,
    preferAbove: false,
    centered: compact,
  });

  const canShow = Boolean(content) && (!onlyWhenTruncated || truncated);

  useLayoutEffect(() => {
    if (!onlyWhenTruncated) {
      setTruncated(true);
      return undefined;
    }

    const root = triggerRef.current;
    if (!root) return undefined;

    function measure() {
      const next = hasTruncatedContent(root);
      setTruncated(next);
      if (!next) setOpen(false);
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(root);
    for (const el of root.querySelectorAll("*")) {
      observer.observe(el);
    }

    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [content, onlyWhenTruncated]);

  useLayoutEffect(() => {
    if (!open || !canShow || !triggerRef.current) return undefined;

    function place() {
      const rect = triggerRef.current.getBoundingClientRect();
      const gutter = 12;
      const isNarrow = window.innerWidth < 640;

      if (compact) {
        const tipWidth = tipRef.current?.offsetWidth || 96;
        let left = rect.left + rect.width / 2 - tipWidth / 2;
        left = Math.min(
          Math.max(gutter, left),
          window.innerWidth - gutter - tipWidth,
        );
        const below = rect.bottom + 8;
        const spaceBelow = window.innerHeight - below;
        const preferAbove = spaceBelow < 64 && rect.top > spaceBelow;
        setCoords({
          top: preferAbove ? Math.max(gutter, rect.top - 8) : below,
          left,
          width: "auto",
          preferAbove,
          centered: false,
        });
        return;
      }

      const maxWidth = Math.min(
        isNarrow ? window.innerWidth - gutter * 2 : 360,
        window.innerWidth - gutter * 2,
      );

      let left = isNarrow
        ? Math.max(gutter, (window.innerWidth - maxWidth) / 2)
        : rect.left;
      if (left + maxWidth > window.innerWidth - gutter) {
        left = Math.max(gutter, window.innerWidth - gutter - maxWidth);
      }

      const below = rect.bottom + 8;
      const spaceBelow = window.innerHeight - below;
      const preferAbove = spaceBelow < 120 && rect.top > spaceBelow;

      setCoords({
        top: preferAbove ? Math.max(gutter, rect.top - 8) : below,
        left,
        width: maxWidth,
        preferAbove,
        centered: false,
      });
    }

    place();
    // Re-place after compact tip mounts so width is known.
    const frame = window.requestAnimationFrame(place);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, canShow, content, compact]);

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      const target = event.target;
      if (triggerRef.current?.contains(target)) return;
      if (tipRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!content) return children;

  function openTip() {
    if (onlyWhenTruncated) {
      if (!truncated && !hasTruncatedContent(triggerRef.current)) return;
    }
    setOpen(true);
  }

  function closeTip() {
    setOpen(false);
  }

  function handleClick(event) {
    if (!prefersTouchUi()) return;
    if (onlyWhenTruncated) {
      const isCutOff =
        truncated || hasTruncatedContent(triggerRef.current);
      if (!isCutOff) return;
      event.preventDefault();
      event.stopPropagation();
    }
    // Compact label tips: don't steal the button click — hover is enough on
    // touch-capable hybrids; allow the action to proceed.
    if (!onlyWhenTruncated && compact) return;
    setOpen((prev) => !prev);
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={className || undefined}
        aria-describedby={open && canShow ? tipId : undefined}
        onMouseEnter={() => {
          if (!prefersTouchUi()) openTip();
        }}
        onMouseLeave={() => {
          if (!prefersTouchUi()) closeTip();
        }}
        onFocus={() => {
          if (!prefersTouchUi()) openTip();
        }}
        onBlur={() => {
          if (!prefersTouchUi()) closeTip();
        }}
        onClick={handleClick}
      >
        {children}
      </span>
      {open && canShow
        ? createPortal(
            <span
              ref={tipRef}
              id={tipId}
              role="tooltip"
              onClick={(event) => {
                if (prefersTouchUi() && !compact) {
                  event.preventDefault();
                  event.stopPropagation();
                  closeTip();
                }
              }}
              className={
                compact
                  ? "pointer-events-none fixed z-[999999] whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-theme-xs font-medium text-gray-700 shadow-tooltip"
                  : "fixed z-[999999] max-h-[min(50vh,280px)] overflow-y-auto rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-theme-xs leading-relaxed text-gray-700 shadow-tooltip sm:pointer-events-none"
              }
              style={{
                top: coords.top,
                left: coords.left,
                width: coords.width,
                maxWidth: compact ? undefined : coords.width,
                transform: coords.preferAbove
                  ? "translateY(-100%)"
                  : undefined,
              }}
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}

export default HoverTooltip;
