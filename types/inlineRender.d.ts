export type Highlight = {
  start: number;
  end: number;
  active: boolean;
};

export type Label = Map<
  string,
  {
    href: string;
    title: string;
  }
>;