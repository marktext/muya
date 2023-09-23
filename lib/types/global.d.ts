import type Content from "@muya/block/base/content";
import type Parent from "@muya/block/base/parent";

declare global {
  interface Window {
    Prism: unknown;
    MUYA_VERSION: string;
  }

  interface Element {
    __MUYA_BLOCK__: Content | Parent;
  }
}
