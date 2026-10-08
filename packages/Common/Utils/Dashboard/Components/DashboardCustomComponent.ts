import DashboardCustomComponent from "../../../Types/Dashboard/DashboardComponents/DashboardCustomComponent";
import { ObjectType } from "../../../Types/JSON";
import ObjectID from "../../../Types/ObjectID";
import DashboardBaseComponentUtil from "./DashboardBaseComponent";
import {
  ComponentArgument,
  ComponentArgumentSection,
  ComponentInputType,
} from "../../../Types/Dashboard/DashboardComponents/ComponentArgument";
import DashboardComponentType from "../../../Types/Dashboard/DashboardComponentType";

const DataSection: ComponentArgumentSection = {
  name: "Data",
  description: "Choose what to show and how to draw it",
  order: 1,
};

export default class DashboardCustomComponentUtil extends DashboardBaseComponentUtil {
  public static override getDefaultComponent(): DashboardCustomComponent {
    return {
      _type: ObjectType.DashboardComponent,
      componentType: DashboardComponentType.Custom,
      widthInDashboardUnits: 6,
      heightInDashboardUnits: 4,
      topInDashboardUnits: 0,
      leftInDashboardUnits: 0,
      componentId: ObjectID.generate(),
      minHeightInDashboardUnits: 2,
      minWidthInDashboardUnits: 3,
      arguments: {
        dataSource: "monitors",
        visualization: "table",
        maxRows: 25,
      },
    };
  }

  public static override getComponentConfigArguments(): Array<
    ComponentArgument<DashboardCustomComponent>
  > {
    return [
      {
        name: "Title",
        description: "Header shown above the widget",
        required: false,
        type: ComponentInputType.Text,
        id: "title",
        section: DataSection,
      },
      {
        name: "Data Source",
        description: "Where the widget gets its data",
        required: true,
        type: ComponentInputType.Dropdown,
        id: "dataSource",
        section: DataSection,
        dropdownOptions: [
          { label: "Monitors", value: "monitors" },
          { label: "Incidents", value: "incidents" },
          { label: "Alerts", value: "alerts" },
        ],
      },
      {
        name: "Visualization",
        description: "How the data is drawn, whatever its source",
        required: true,
        type: ComponentInputType.Dropdown,
        id: "visualization",
        section: DataSection,
        dropdownOptions: [
          { label: "Table", value: "table" },
          { label: "Stat (total count)", value: "stat" },
          { label: "Bar (count by status)", value: "bar" },
        ],
      },
      {
        name: "Max Rows",
        description:
          "Most items to fetch. The Stat shows the true total; the Table and Bar use these items.",
        required: false,
        type: ComponentInputType.Number,
        id: "maxRows",
        placeholder: "25",
        section: DataSection,
      },
    ];
  }
}
