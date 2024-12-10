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
  