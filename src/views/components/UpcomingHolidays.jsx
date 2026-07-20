import { useCallback, useEffect, useRef, useState } from "react";

function UpcomingHolidays({ holidays }) {
  const scrollRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const [dragging, setDragging] = useState(false);

  const handleMouseMove = useCallback((event) => {
    if (!dragRef.current.active || !scrollRef.current) return;
    event.preventDefault();
    const deltaX = event.pageX - dragRef.current.startX;
    scrollRef.current.scrollLeft = dragRef.current.scrollLeft - deltaX;
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current.active = false;
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!dragging) return undefined;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  function handleMouseDown(event) {
    if (event.button !== 0 || !scrollRef.current) return;

    dragRef.current = {
      active: true,
      startX: event.pageX,
      scrollLeft: scrollRef.current.scrollLeft,
    };
    setDragging(true);
  }

  return (
    <div className="shrink-0 rounded-2xl border border-gray-200 bg-white px-3 py-2.5">
      <h3 className="mb-2 text-sm font-semibold text-gray-800">
        Upcoming Holidays
      </h3>

      {holidays.length === 0 ? (
        <p className="text-[11px] text-gray-500">
          No upcoming holidays in this year.
        </p>
      ) : (
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          className={`no-scrollbar flex touch-pan-x gap-2 overflow-x-auto ${
            dragging
              ? "cursor-grabbing select-none"
              : "cursor-grab"
          }`}
        >
          {holidays.map((holiday) => {
            const day = holiday.date?.slice(8, 10);
            const monthLabel = holiday.dateLabel?.split("-")[1] || "";

            return (
              <div
                key={holiday.id}
                className="flex min-w-0 shrink-0 basis-[calc(50%-4px)] items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-2.5 py-1.5 sm:basis-[calc(33.333%-5.33px)] xl:basis-[calc(25%-6px)]"
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${holiday.typeDotClass}`}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight text-gray-800">
                    {Number(day)}{" "}
                    <span className="text-[10px] font-medium uppercase text-gray-500">
                      {monthLabel}
                    </span>
                  </p>
                  <p className="truncate text-[11px] font-medium text-gray-800">
                    {holiday.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UpcomingHolidays;
