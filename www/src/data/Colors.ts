import * as fractals from 'fractals/common';

export type Color = [number, number, number];

export interface GradientPivot {
  readonly color: Color,
  readonly id: string,
  readonly value: number,
}

export interface ColorsState {
  readonly inside: Color,
  readonly gradient: GradientPivot[],
}
