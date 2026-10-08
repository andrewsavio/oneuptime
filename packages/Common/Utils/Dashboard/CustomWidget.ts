import {
  CustomWidgetDataSource,
  CustomWidgetVisualization,
} from "../../Types/Dashboard/DashboardComponents/DashboardCustomComponent";

/*
 * Every data source of the Custom widget is reduced to this one shape, which
 * is what lets any source be drawn as any visualization.
 */
export interface CustomWidgetRow {
  id: string;
  name: string;
  status: string;
  color: string;
}

export interface CustomWidgetStatusCount {
  status: string;
  color: string;
  count: number;
}

export const CUSTOM_WIDGET_DATA_SOURCES: ReadonlyArray<CustomWidgetDataSource> =
  ["monitors", "incidents", "alerts"];

export const CUSTOM_WIDGET_VISUALIZATIONS: ReadonlyArray<CustomWidgetVisualization> =
  ["table", "stat", "bar"];

/*
 * A stored widget can hold a value the dropdown no longer offers (or none at
 * all, if it was saved before the field existed), so fall back to the defaults
 * instead of rendering nothing.
 */
export function resolveCustomWidgetDataSource(
  value: string | undefined,
): CustomWidgetDataSource {
  return (
    CUSTOM_WIDGET_DATA_SOURCES.find((source: CustomWidgetDataSource) => {
      return source === value;
    }) || "monitors"
  );
}

export function resolveCustomWidgetVisualization(
  value: string | undefined,
): CustomWidgetVisualization {
  return (
    CUSTOM_WIDGET_VISUALIZATIONS.find(
      (visualization: CustomWidgetVisualization) => {
        return visualization === value;
      },
    ) || "table"
  );
}

// Rows grouped by status, biggest group first (ties keep first-seen order).
export function countRowsByStatus(
  rows: ReadonlyArray<CustomWidgetRow>,
): Array<CustomWidgetStatusCount> {
  const byStatus: Map<string, CustomWidgetStatusCount> = new Map();

  for (const row of rows) {
    const existing: CustomWidgetStatusCount | undefined = byStatus.get(
      row.status,
    );

    if (existing) {
      existing.count++;
    } else {
      byStatus.set(row.status, {
        status: row.status,
        color: row.color,
        count: 1,
      });
    }
  }

  return Array.from(byStatus.values()).sort(
    (a: CustomWidgetStatusCount, b: CustomWidgetStatusCount) => {
      return b.count - a.count;
    },
  );
}
