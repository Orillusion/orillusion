export class GUIConfig {
  public static readonly vertexScale: number = 1;
  public static quadMaxCountForWorld: number = 256;
  public static quadMaxCountForView: number = 2048;
  public static readonly SortOrderStart: number = 8000;
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
  Normal = 0,
  BillboardY = 9,
  BillboardXYZ = 10,
}