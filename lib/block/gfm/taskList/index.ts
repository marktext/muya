import Parent from "@muya/block/base/parent";
import ContainerQueryBlock from "@muya/block/mixins/containerQueryBlock";
import ScrollPage from "@muya/block/scrollPage";
import { mixins } from "@muya/utils";
import { ITaskListMeta, ITaskListState } from "../../../state/types";

@mixins(ContainerQueryBlock)
class TaskList extends Parent {
  public meta: ITaskListMeta;

  static blockName = "task-list";

  static create(muya, state) {
    const taskList = new TaskList(muya, state);

    taskList.append(
      ...state.children.map((child) =>
        ScrollPage.loadBlock(child.name).create(muya, child)
      )
    );

    return taskList;
  }

  get path() {
    const { path: pPath } = this.parent;
    const offset = this.parent.offset(this);

    return [...pPath, offset, "children"];
  }

  constructor(muya, { meta }) {
    super(muya);
    this.tagName = "ul";
    this.meta = meta;
    this.datasets = {
      marker: meta.marker,
    };
    this.classList = ["mu-task-list"];
    if (!meta.loose) {
      this.classList.push("mu-tight-list");
    }
    this.createDomNode();
  }

  /**
   * Auto move checked list item to the end of task list.
   */
  orderIfNecessary() {
    const { autoMoveCheckedToEnd } = this.muya.options;
    if (!autoMoveCheckedToEnd) {
      return;
    }

    let first: any = this.firstChild;
    let last: any = this.lastChild;
    let anchor = first;

    while (first !== last) {
      if (!first.checked) {
        first = first.next;
        anchor = first;
      } else if (last.checked) {
        last = last.prev;
      } else {
        const temp = last;
        last = last.prev;
        temp.insertInto(this, anchor);
        anchor = temp;
      }
    }
  }

  getState(): ITaskListState {
    const state: ITaskListState = {
      name: "task-list",
      meta: { ...this.meta },
      children: this.children.map((child) => child.getState()),
    };

    return state;
  }
}

export default TaskList;
