export {};

declare global {
  interface Window {
    Prism: unknown;
    MUYA_VERSION: string;
  }

  interface Element {
    __MUYA_BLOCK__: unknown;
  }
}
