import ObjectID from "../../ObjectID";
import DashboardComponentType from "../DashboardComponentType";
import BaseComponent from "./DashboardBaseComponent";

/*
 * A Custom widget picks its data source and its visualization independently,
 * so any source can be drawn as any visualization. Every source is reduced to
 * the same row shape (a name plus a status) before it is drawn.
 */
export type CustomWidgetDataSource = "monitors" | "incidents" | "alerts";

export type CustomWidgetVisualization = "table" | "stat" | "bar";

export default interface DashboardCustomComponent extends BaseComponent {
  componentType: DashboardComponentType.Custom;
  componentId: ObjectID;
  arguments: {
    title?: string | undefined;
    dataSource?: CustomWidgetDataSource | undefined;
    visualization?: CustomWidgetVisualization | undefined;
    maxRows?: number | undefined;
  };
}
