import type { Tokens } from 'marked';

export interface ILexOption {
    footnote?: boolean;
    math?: boolean;
    isGitlabCompatibilityEnabled?: boolean;
    frontMatter?: boolean;
    superSubScript?: boolean;
}

export type Heading = Tokens.Heading & {
    headingStyle: 'setext' | 'atx';
    marker: string;
};

export type ListItemToken = Tokens.ListItem & {
    listItemType: 'order' | 'bullet' | 'task';
    bulletMarkerOrDelimiter: '.' | ')' | '*' | '+' | '-' | '';
};

export type ListToken = Tokens.List & {
    listType: 'order' | 'bullet' | 'task';
    items: ListItemToken[];
};
