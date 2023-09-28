import TreeNode from "@muya/block/base/treeNode";
import { isFirefox } from "@muya/config";
import Muya from "@muya/index";
import { ITaskListItemMeta } from "@muya/state/types";
import { isMouseEvent } from "@muya/utils";
import { operateClassName } from "@muya/utils/dom";
import logger from "@muya/utils/logger";
import TaskList from "../taskList";
import TaskListItem from "../taskListItem";

const debug = logger("tasklistCheckbox:");

// The Task List Item component is Firefox compatible, because in Firefox,
// the input element is not clickable in the contenteditable element(li),
// and in Firefox, the span element is used instead of the input element.
// In the Chrome browser, the input element is still preserved because in Chrome,
// span has a cursor staggered problem.
class TaskListCheckbox extends TreeNode {
  private checked: boolean;
  private eventIds: string[] = [];

  static blockName = "task-list-checkbox";

  static create(muya: Muya, meta: ITaskListItemMeta) {
    const checkbox = new TaskListCheckbox(muya, meta);

    return checkbox;
  }

  get path() {
    const { path: pPath } = this.parent!;
    pPath.pop(); // pop `children`

    return [...pPath, "meta", "checked"];
  }

  get isContainerBlock() {
    return false;
  }

  constructor(muya: Muya, { checked }: ITaskListItemMeta) {
    super(muya);
    this.tagName = isFirefox ? "span" : "input";
    this.checked = checked;
    this.attributes = isFirefox
      ? { contenteditable: "false" }
      : { type: "checkbox", contenteditable: "false" };
    this.classList = ["mu-task-list-checkbox"];

    if (checked) {
      if (!isFirefox) {
        this.attributes.checked = true;
      }
      this.classList.push("mu-checkbox-checked");
    }

    this.createDomNode();
    this.listen();
  }

  listen() {
    const { domNode, muya } = this;
    const { eventCenter } = muya;
    const clickHandler = (event: Event) => {
      if (!isMouseEvent(event)) {
        return;
      }
      event.stopPropagation();

      if (isFirefox) {
        this.checked = !this.checked;

        this.update(this.checked, "user");
      } else {
        const { checked } = event.target as HTMLInputElement;
        this.checked = checked;
        this.update(checked, "user");
      }
    };

    const eventIds = [
      eventCenter.attachDOMEvent(domNode!, "click", clickHandler),
    ];

    this.eventIds.push(...eventIds);
  }

  update = (checked: boolean, source = "api") => {
    operateClassName(
      this.domNode!,
      checked ? "add" : "remove",
      "mu-checkbox-checked"
    );
    const taskListItem = this.parent as TaskListItem;
    const taskList = taskListItem!.parent as TaskList;

    if ((this.domNode as HTMLInputElement).checked !== checked && !isFirefox) {
      (this.domNode as HTMLInputElement).checked = checked;
    }

    if (source === "api") {
      taskListItem.meta.checked = checked;
    } else {
      taskListItem.checked = checked;
    }

    taskList.orderIfNecessary();
  };

  detachDOMEvents() {
    for (const id of this.eventIds) {
      this.muya.eventCenter.detachDOMEvent(id);
    }
  }

  remove() {
    this.detachDOMEvents();
    super.remove();
    if (this.domNode) {
      this.domNode.remove();
    }
    this.domNode = null;
  }

  getState() {
    debug.warn("You should never call this method.");
  }
}

export default TaskListCheckbox;
