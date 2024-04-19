import type { Placement } from 'popper.js';

export interface IBaseOptions {
    placement: Placement;
    modifiers: {
        offset: {
            offset: string;
        };
    };
    showArrow: boolean;
}
