// src/types/types.ts

export interface Details {
    Name: string;
    Description: string;
    Width: number;
    Height: number;
    Depth: number;
    Data1?: number; // Optional data fields
    Data2?: number;
    Data3?: number;
  }
  
  export interface JsonData {
    ID: string;
    ShapeID: string;
    ViewID: string;
    View: string;
    ViewX: number;
    ViewY: number;
    ViewWidth: number;
    ViewLength: number;
    ViewDepth: number;
    Tooltip: string;
    SVGFile: string;
    Details: Details[];
  }

  export interface BoxType {
    RowNo: string;
    _Site: string;
    _Room: string;
    _Floor: string;
    _Location: string;
    EQID: string;
    _Device: string;
    Desc120: string;
    ShortName: string;
    Width: string;
    Length: string;
    Height: string;
    Weight: string;
  }

  // src/types.ts

export interface Detail {
  Name: string;
  Description: string;
  Path: string;
  Power: number;
  Space: number;
  Temp: number;
  Width: number;
  Height: number;
  Depth: number;
}

export interface ParentItem {
  ID: string;
  ShapeID: string;
  ViewID: string;
  View: string;
  ViewX: number;
  ViewY: number;
  ViewWidth: number;
  ViewLength: number;
  ViewDepth: number;
  Tooltip: string;
  Scale: number;
  SVGFile: string;
  Details: Detail[];
  Slots: any;
  Mounted: any;
}

export interface ParentJSON {
  Parent: ParentItem[];
}

  