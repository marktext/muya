import alignLeftIcon from "@muya/assets/icons/align_left/2.png";
import alignCenterIcon from "@muya/assets/icons/align_center/2.png";
import alignRightIcon from "@muya/assets/icons/align_right/2.png";
import insertLeftIcon from "@muya/assets/icons/table_column/table-column-plus-left.png";
import insertRightIcon from "@muya/assets/icons/table_column/table-column-plus-right.png";
import removeColumnIcon from "@muya/assets/icons/table_column/table-column-remove.png";

const icons = [
  {
    type: "left",
    tooltip: "Align Left",
    icon: alignLeftIcon,
  },
  {
    type: "center",
    tooltip: "Align Center",
    icon: alignCenterIcon,
  },
  {
    type: "right",
    tooltip: "Align Right",
    icon: alignRightIcon,
  },
  {
    type: "insert left",
    tooltip: "Insert Column left",
    icon: insertLeftIcon,
  },
  {
    type: "insert right",
    tooltip: "Insert Column right",
    icon: insertRightIcon,
  },
  {
    type: "remove",
    tooltip: "Remove Column",
    icon: removeColumnIcon,
  },
];

export default icons;
