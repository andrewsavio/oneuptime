import { describe, expect, test } from "@jest/globals";
import DashboardCustomComponentUtil from "../../../../Utils/Dashboard/Components/DashboardCustomComponent";
import DashboardComponentsUtil from "../../../../Utils/Dashboard/Components/Index";
import DashboardComponentType from "../../../../Types/Dashboard/DashboardComponentType";
import {
  CustomWidgetRow,
  countRowsByStatus,
  resolveCustomWidgetDataSource,
  resolveCustomWidgetVisualization,
} from "../../../../Utils/Dashboard/CustomWidget";

function row(id: string, status: string, color: string): CustomWidgetRow {
  return { id: id, name: id, status: status, color: color };
}

describe("DashboardCustomComponentUtil", () => {
  test("defaults to monitors drawn as a table", () => {
    const component: ReturnType<
      typeof DashboardCustomComponentUtil.getDefaultComponent
    > = DashboardCustomComponentUtil.getDefaultComponent();

    expect(component.componentType).toBe(DashboardComponentType.Custom);
    expect(component.arguments.dataSource).toBe("monitors");
    expect(component.arguments.visualization).toBe("table");
  });

  test("offers every data source and visualization independently", () => {
    const args: ReturnType<
      typeof DashboardComponentsUtil.getComponentSettingsArguments
    > = DashboardComponentsUtil.getComponentSettingsArguments(
      DashboardComponentType.Custom,
    );

    const values: (id: string) => Array<string | number | undefined> = (
      id: string,
    ) => {
      return (
        args
          .find((arg: { id: string | number | symbol }) => {
            return arg.id === id;
          })
          ?.dropdownOptions?.map((option: { value: unknown }) => {
            return option.value as string;
          }) || []
      );
    };

    expect(values("dataSource")).toEqual(["monitors", "incidents", "alerts"]);
    expect(values("visualization")).toEqual(["table", "stat", "bar"]);
  });
});

describe("resolveCustomWidget*", () => {
  test("falls back to the defaults for missing or unknown values", () => {
    expect(resolveCustomWidgetDataSource(undefined)).toBe("monitors");
    expect(resolveCustomWidgetDataSource("nope")).toBe("monitors");
    expect(resolveCustomWidgetDataSource("alerts")).toBe("alerts");
    expect(resolveCustomWidgetVisualization(undefined)).toBe("table");
    expect(resolveCustomWidgetVisualization("bar")).toBe("bar");
  });
});

describe("countRowsByStatus", () => {
  test("groups by status, largest first", () => {
    const counts: ReturnType<typeof countRowsByStatus> = countRowsByStatus([
      row("a", "Up", "#0f0"),
      row("b", "Down", "#f00"),
      row("c", "Down", "#f00"),
    ]);

    expect(counts).toEqual([
      { status: "Down", color: "#f00", count: 2 },
      { status: "Up", color: "#0f0", count: 1 },
    ]);
  });

  test("is empty for no rows", () => {
    expect(countRowsByStatus([])).toEqual([]);
  });
});
