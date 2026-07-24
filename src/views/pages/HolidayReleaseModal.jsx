import ModalShell from "../components/ModalShell.jsx";
import { FieldError, RequiredMark } from "../components/forms/FormHelpers.jsx";
import SelectField from "../components/forms/SelectField.jsx";
import { PlusIcon } from "../icons/ActionIcons.jsx";
import { HOLIDAY_TYPES } from "../../models/holidaysModel.js";
import { LABEL_CLASS } from "../../models/formLayoutModel.js";

const CELL_INPUT =
  "box-border h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10";

const CELL_INPUT_ERROR =
  "box-border h-10 w-full min-w-0 rounded-lg border border-error-500 bg-white px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-error-500 focus:outline-hidden focus:ring-3 focus:ring-error-500/10";

const TH =
  "sticky top-0 z-10 bg-gray-50 px-3 py-2.5 text-left text-theme-xs font-medium text-gray-500";

function HolidayReleaseModal({
  open,
  year,
  yearOptions,
  rows,
  fieldErrors,
  error,
  info,
  loading,
  releasing,
  onClose,
  onYearChange,
  onRowChange,
  onAddRow,
  onRemoveRow,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <ModalShell
      onClose={onClose}
      title="Release Holiday Calendar"
      description="Select a year from the current year through 2030 that has not been released yet. Holidays are fetched from the India holiday calendar for that year — edit the list, then release once."
      panelClassName="relative mx-auto flex w-full min-w-0 max-w-[min(960px,calc(100vw-2rem))] flex-col rounded-3xl bg-white p-5 lg:p-8"
    >
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex min-h-0 flex-1 flex-col gap-4 px-1"
      >
        {error ? (
          <p className="text-theme-sm text-error-600">{error}</p>
        ) : null}
        {info ? (
          <p className="text-theme-sm text-gray-600">{info}</p>
        ) : null}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-full min-w-[140px] max-w-[180px]">
            <label className={LABEL_CLASS} htmlFor="release-year">
              Year
              <RequiredMark />
            </label>
            <SelectField
              value={String(year)}
              onChange={onYearChange}
              ariaLabel="Release year"
              options={yearOptions}
            />
          </div>

          <button
            type="button"
            onClick={onAddRow}
            disabled={loading || releasing}
            title="Add Row"
            aria-label="Add Row"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md p-0.5 transition hover:opacity-80 hover:scale-105 disabled:opacity-60"
          >
            <PlusIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-200">
          <div className="max-h-[min(48vh,420px)] overflow-auto">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[16%]" />
                <col className="w-[22%]" />
                <col className="w-[26%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-200">
                  <th className={TH}>Name</th>
                  <th className={TH}>Date</th>
                  <th className={TH}>Type</th>
                  <th className={TH}>Description</th>
                  <th className={`${TH} text-center`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-theme-sm text-gray-500"
                    >
                      Loading holidays from calendar…
                    </td>
                  </tr>
                ) : null}

                {!loading && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-theme-sm text-gray-500"
                    >
                      No holidays loaded. Use + Add Row to add holidays.
                    </td>
                  </tr>
                ) : null}

                {!loading
                  ? rows.map((row, index) => (
                      <tr key={`release-row-${index}`}>
                        <td className="px-3 py-2.5 align-top">
                          <input
                            value={row.name}
                            onChange={(event) =>
                              onRowChange(index, "name", event.target.value)
                            }
                            className={
                              fieldErrors[index]?.name
                                ? CELL_INPUT_ERROR
                                : CELL_INPUT
                            }
                            placeholder="Holiday name"
                          />
                          <FieldError message={fieldErrors[index]?.name} />
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <input
                            type="date"
                            value={row.date}
                            onChange={(event) =>
                              onRowChange(index, "date", event.target.value)
                            }
                            className={
                              fieldErrors[index]?.date
                                ? CELL_INPUT_ERROR
                                : CELL_INPUT
                            }
                          />
                          <FieldError message={fieldErrors[index]?.date} />
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <SelectField
                            value={row.type}
                            onChange={(value) =>
                              onRowChange(index, "type", value)
                            }
                            ariaLabel={`Holiday type row ${index + 1}`}
                            hasError={Boolean(fieldErrors[index]?.type)}
                            options={HOLIDAY_TYPES.map((value) => ({
                              value,
                              label: value,
                            }))}
                          />
                          <FieldError message={fieldErrors[index]?.type} />
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <input
                            value={row.description}
                            onChange={(event) =>
                              onRowChange(
                                index,
                                "description",
                                event.target.value,
                              )
                            }
                            className={CELL_INPUT}
                            placeholder="Description"
                          />
                        </td>
                        <td className="px-2 py-2.5 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => onRemoveRow(index)}
                            className="inline-flex h-10 items-center justify-center rounded-lg px-2 text-theme-sm font-medium text-error-600 hover:bg-error-50 hover:text-error-700"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center border-t border-gray-100 pt-4">
          <button
            type="submit"
            disabled={releasing || loading}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
          >
            {releasing ? "Releasing…" : "Release Calendar"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export default HolidayReleaseModal;
