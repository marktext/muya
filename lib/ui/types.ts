import type { Placement } from "popper.js";

export type BaseOptions = {
  placement: Placement;
  modifiers: {
    offset: {
      offset: string;
    };
  };
  showArrow: boolean;
}