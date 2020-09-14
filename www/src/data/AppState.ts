import { ColorsState } from 'data/Colors';

export interface AppState {
  readonly colors: ColorsState,
  readonly numColors: number,
  readonly sidebar: {
    readonly expanded: boolean,
  },
}
