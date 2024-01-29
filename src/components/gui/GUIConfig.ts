export class GUIConfig {
  public static panelRatio: number = 1.0;
  public static quadMaxCountForWorld: number = 256;
  public static quadMaxCountForView: number = 2048;
  public static readonly SortOrderStartWorld: number = 7000;
  public static readonly SortOrderStartView: number = 8000;
  public static readonly SortOrderCanvasSpan: number = 10000;
}

export enum GUISpace {
  View = 0,
  World = 2,
}


export enum ImageType {
  Simple,
  Sliced,
  Tiled,
  Filled,
}

export enum BillboardType {
  None = 0,
  BillboardY = 9,
  BillboardXYZ = 10,
}