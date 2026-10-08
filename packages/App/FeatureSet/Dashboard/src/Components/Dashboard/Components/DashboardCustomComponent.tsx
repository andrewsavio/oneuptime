import React, {
  FunctionComponent,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import DashboardCustomComponent from "Common/Types/Dashboard/DashboardComponents/DashboardCustomComponent";
import { DashboardBaseComponentProps } from "./DashboardBaseComponent";
import DashboardResourceListBase, {
  ResourceListColumn,
} from "./DashboardResourceListBase";
import ModelAPI, { ListResult } from "Common/UI/Utils/ModelAPI/ModelAPI";
import DashboardResourceList from "../Utils/DashboardResourceList";
import Monitor from "Common/Models/DatabaseModels/Monitor";
import Incident from "Common/Models/DatabaseModels/Incident";
import Alert from "Common/Models/DatabaseModels/Alert";
import API from "Common/UI/Utils/API/API";
import IconProp from "Common/Types/Icon/IconProp";
import SortOrder from "Common/Types/BaseDatabase/SortOrder";
import JSONFunctions from "Common/Types/JSONFunctions";
import ProjectUtil from "Common/UI/Utils/Project";
import ObjectID from "Common/Types/ObjectID";
import Color from "Common/Types/Color";
import {
  CustomWidgetDataSource,
  CustomWidgetVisualization,
} from "Common/Types/Dashboard/DashboardComponents/DashboardCustomComponent";
import {
  CustomWidgetRow,
  CustomWidgetStatusCount,
  countRowsByStatus,
  resolveCustomWidgetDataSource,
  resolveCustomWidgetVisualization,
} from "Common/Utils/Dashboard/CustomWidget";

export interface ComponentProps extends DashboardBaseComponentProps {
  component: DashboardCustomComponent;
}

const NO_STATUS_COLOR: string = "#9ca3af";

const COLUMNS: Array<ResourceListColumn> = [
  { label: "Name", widthPct: "65%" },
  { label: "Status", widthPct: "35%" },
];

interface SourceFetchResult {
  rows: Array<CustomWidgetRow>;
  total: number;
}

type NamedStatus =
  { name?: string | undefined; color?: Color | undefined } | undefined;

function toRow(
  id: string | undefined,
  name: string | undefined,
  status: NamedStatus,
): CustomWidgetRow {
  return {
    id: id || name || "",
    name: name || "Unnamed",
    status: status?.name || "Unknown",
    color: status?.color ? status.color.toString() : NO_STATUS_COLOR,
  };
}

/*
 * One fetcher per data source. Adding a source means adding a fetcher here
 * that maps the model to CustomWidgetRow, and a dropdown option.
 */
async function fetchSource(
  dataSource: CustomWidgetDataSource,
  props: ComponentProps,
  projectId: ObjectID | null,
  limit: number,
): Promise<SourceFetchResult> {
  const widgetContext: {
    componentId: ObjectID;
    variables: ComponentProps["variables"];
  } = { componentId: props.componentId, variables: props.variables };

  if (dataSource === "incidents") {
    const result: ListResult<Incident> = await ModelAPI.getList<Incident>({
      modelType: Incident,
      requestOptions: DashboardResourceList.getRequestOptions(
        "incident",
        widgetContext,
      ),
      query: { projectId: projectId } as never,
      limit: limit,
      skip: 0,
      select: {
        _id: true,
        title: true,
        currentIncidentState: { name: true, color: true },
      },
      sort: { createdAt: SortOrder.Descending },
    });

    return {
      total: result.count,
      rows: result.data.map((incident: Incident) => {
        return toRow(
          incident._id as string,
          incident.title,
          incident.currentIncidentState,
        );
      }),
    };
  }

  if (dataSource === "alerts") {
    const result: ListResult<Alert> = await ModelAPI.getList<Alert>({
      modelType: Alert,
      requestOptions: DashboardResourceList.getRequestOptions(
        "alert",
        widgetContext,
      ),
      query: { projectId: projectId } as never,
      limit: limit,
      skip: 0,
      select: {
        _id: true,
        title: true,
        currentAlertState: { name: true, color: true },
      },
      sort: { createdAt: SortOrder.Descending },
    });

    return {
      total: result.count,
      rows: result.data.map((alert: Alert) => {
        return toRow(alert._id as string, alert.title, alert.currentAlertState);
      }),
    };
  }

  const result: ListResult<Monitor> = await ModelAPI.getList<Monitor>({
    modelType: Monitor,
    requestOptions: DashboardResourceList.getRequestOptions(
      "monitor",
      widgetContext,
    ),
    query: { projectId: projectId } as never,
    limit: limit,
    skip: 0,
    select: {
      _id: true,
      name: true,
      currentMonitorStatus: { name: true, color: true },
    },
    sort: { name: SortOrder.Ascending },
  });

  return {
    total: result.count,
    rows: result.data.map((monitor: Monitor) => {
      return toRow(
        monitor._id as string,
        monitor.name,
        monitor.currentMonitorStatus,
      );
    }),
  };
}

const DashboardCustomComponentElement: FunctionComponent<ComponentProps> = (
  props: ComponentProps,
): ReactElement => {
  const [rows, setRows] = useState<Array<CustomWidgetRow>>([]);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const requestVersion: React.MutableRefObject<number> = useRef<number>(0);

  const dataSource: CustomWidgetDataSource = resolveCustomWidgetDataSource(
    props.component.arguments.dataSource,
  );
  const visualization: CustomWidgetVisualization =
    resolveCustomWidgetVisualization(props.component.arguments.visualization);
  const maxRows: number = props.component.arguments.maxRows || 25;
  const title: string | undefined = props.component.arguments.title;

  const fetchRows: () => Promise<void> = useCallback(async () => {
    const version: number = ++requestVersion.current;

    /*
     * The public dashboard API only serves the resource lists of the
     * widgets it knows, and this one is not among them.
     */
    if (DashboardResourceList.isPublic()) {
      setError("Custom widgets are not available on public dashboards.");
      setIsLoading(false);
      return;
    }

    const projectId: ObjectID | null = ProjectUtil.getCurrentProjectId();
    if (!projectId) {
      setError("No project selected.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const result: SourceFetchResult = await fetchSource(
        dataSource,
        props,
        projectId,
        maxRows,
      );

      if (version !== requestVersion.current) {
        return;
      }

      setRows(result.rows);
      setTotal(result.total);
      setError(null);
    } catch (err: unknown) {
      if (version !== requestVersion.current) {
        return;
      }
      setError(API.getFriendlyErrorMessage(err as Error));
    }

    setIsLoading(false);
  }, [dataSource, maxRows, props.componentId, props.variables]);

  useEffect(() => {
    fetchRows();
    return () => {
      // A slower request for a previous data source must not replace this one.
      requestVersion.current++;
    };
  }, [fetchRows, props.refreshTick]);

  if (visualization === "table") {
    return (
      <DashboardResourceListBase
        title={title}
        pluralLabel={dataSource}
        columns={COLUMNS}
        count={rows.length}
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        emptyMessage={`No ${dataSource} found`}
        emptyIcon={IconProp.TableCells}
      >
        {rows.map((row: CustomWidgetRow) => {
          return (
            <tr key={row.id} className="hover:bg-gray-50/50">
              <td className="px-3 py-2 text-xs text-gray-700 truncate">
                {row.name}
              </td>
              <td className="px-3 py-2 text-xs font-medium">
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: row.color }}
                ></span>
                <span style={{ color: row.color }}>{row.status}</span>
              </td>
            </tr>
          );
        })}
      </DashboardResourceListBase>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full text-xs text-gray-400 text-center">
        {error}
      </div>
    );
  }

  if (visualization === "stat") {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold text-gray-800 tabular-nums">
          {isLoading ? "…" : total}
        </span>
        <span className="mt-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
          {title || dataSource}
        </span>
      </div>
    );
  }

  const counts: Array<CustomWidgetStatusCount> = countRowsByStatus(rows);
  const largest: number = counts[0]?.count || 1;

  return (
    <div className="h-full overflow-auto px-1">
      {title && (
        <div className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
          {title}
        </div>
      )}
      {!isLoading && counts.length === 0 && (
        <div className="text-xs text-gray-400">No {dataSource} found</div>
      )}
      {counts.map((item: CustomWidgetStatusCount) => {
        return (
          <div key={item.status} className="mb-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>{item.status}</span>
              <span className="tabular-nums">{item.count}</span>
            </div>
            <div className="h-2 rounded bg-gray-100">
              <div
                className="h-2 rounded"
                style={{
                  width: `${(item.count / largest) * 100}%`,
                  backgroundColor: item.color,
                }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

function arePropsEqual(prev: ComponentProps, next: ComponentProps): boolean {
  if (
    prev.componentId.toString() !== next.componentId.toString() ||
    prev.refreshTick !== next.refreshTick ||
    prev.isEditMode !== next.isEditMode ||
    prev.isSelected !== next.isSelected ||
    !JSONFunctions.deepEqual(prev.variables, next.variables) ||
    prev.dashboardComponentWidthInPx !== next.dashboardComponentWidthInPx ||
    prev.dashboardComponentHeightInPx !== next.dashboardComponentHeightInPx
  ) {
    return false;
  }

  return JSONFunctions.deepEqual(
    prev.component.arguments,
    next.component.arguments,
  );
}

export default React.memo(DashboardCustomComponentElement, arePropsEqual);
