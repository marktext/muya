export {};

declare global {
  interface Window {
    Prism: unknown;
  }

  interface HTMLElement {
    __MUYA_BLOCK__: unknown;
  }
}
