// @ts-nocheck
import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { mixin } from "@muya/utils";
import ContainerQueryBlock from "@muya/block/mixins/containerQueryBlock";
import { ITaskListItemMeta, ITaskListItemState } from "../../../jsonState/types";

@mixin(ContainerQueryBlock)
class TaskListItem extends Parent {
  public meta: ITaskListItemMeta;

  static blockName = "task-list-item";

  static create(muya, state) {
    const listItem = new TaskListItem(muya, state);

    listItem.appendAttachment(
      ScrollPage.loadBlock("task-list-checkbox").create(muya, state.meta)
    );
    listItem.append(
      ...state.children.map((child) =>
        ScrollPage.loadBlock(child.name).create(muya, child)
      )
    );

    return listItem;
  }

  get path() {
    const { path: pPath } = this.parent;
    const offset = this.parent.offset(this);

    return [...pPath, offset, "children"];
  }

  get checked() {
    return this.meta.checked;
  }

  set checked(checked) {
    const oldCheckStatus = this.meta.checked;
    this.meta.checked = checked;
    if (checked !== oldCheckStatus) {
      const { path } = this;
      path.pop();
      path.push("meta", "checked");

      this.jsonState.pushOperation("replaceOp", path, oldCheckStatus, checked);
    }
  }

  constructor(muya, { meta }) {
    super(muya);
    this.tagName = "li";
    this.meta = meta;
    this.classList = ["mu-task-list-item"];
    this.createDomNode();
  }

  find(key) {
    if (typeof key === "number") {
      return super.find(key);
    } else if (typeof key === "string") {
      // If key is checked.
      // Return taskListCheckbox.
      return this.attachments.head;
    }
  }

  getState(): ITaskListItemState {
    const state: ITaskListItemState = {
      name: "task-list-item",
      meta: { ...this.meta },
      children: this.children.map((child) => child.getState()),
    };

    return state;
  }
}

export default TaskListItem;
