// src/types/types.ts

export interface Details {
  Name: string;
  Description: string;
  Width: number;
  Height: number;
  Depth: number;
  Data1?: number;
  Data2?: number;
  Data3?: number;
}

export interface Slots {
  ShapeID: string;
  Name: string;
  CompositeName: string;
  SlotViewX: number;
  SlotViewY: number;
  SlotViewWidth: number;
  SlotViewLength: number;
  SlotUse: string | null;
  SlotMountType: string;
  SlotIndex: number;
  SlotID: string;
}

export interface Mounted {
  ShapeID: string;
  ViewID: string;
  SlotID: string;
  Name: string;
  SlotViewX: number;
  SlotViewY: number;
  SlotViewWidth: number;
  SlotViewLength: number;
  IsFirstSlot: boolean;
  SlotUse: string;
  SlotMountType: string;
  SlotIndex: number;
  ToolTip: string;
  View: string;
  MountedShapeID: string;
  MountedDeviceViewID?: string;
  MountedDeviceViewAngle: number;
  ModViewX: number;
  ModViewY: number;
  ModViewWidth: number;
  ModViewLength: number;
  ModViewDepth?: number;
  Scale: number;
  SVGFile: string;
  OtherSideSVGFile: string | null;
  Details: Details[]; 
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

export interface JsonType {
  ID: string;
  ShapeID: string;
  ViewID: string;
  View: string;
  ViewX: number;
  ViewY: number;
  ViewWidth: number;
  ViewLength: number;
  ViewDepth?: number;
  Tooltip: string;
  Scale: number;
  SVGFile: string;
  Details: Details[];
  Slots?: Slots[] | null | undefined;
  Mounted?: Mounted[] | null | undefined; // Allow null and undefined
}

export interface ParentJSON {
  Parent: JsonType[];
}

export interface shape {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  length: number;
  rotation: number;
  height?: number; // Optional, can be undefined
  offset?: number; // Optional, can be undefined
  scaleX?: number;
  scaleY?: number;
  groupId?: string | null; // Optional
  fill: string;
  strokeWidth?: number; // Optional
  visible: boolean;
  views?: JsonType[]; // Optional
}

export interface horizontalShape {
  name: string;
  id: number;
  orientation: string;
  width: number;
  length: number;
  height: number;
  elevation: number;
  type: string;
  fill: string;
  opacity: number;
  shapes: shape[]; // Array of shape
}

export interface verticalShape {
  name: string;
  id: number;
  orientation: string;
  width: number;
  height: number;
  elevation: number;
  type: string;
  fill: string;
  opacity: number;
  shape?: []; // Array of shape
}

export interface dataValue {
  name: string;
  criterion: string;
  trueColor: string;
  falseColor: string;
}

export interface RoomType {
  roomprofile: {
    name: string;
    lastupdated: string;
  },
  datavalues: dataValue[];
    room: {
      name: string;
      id: number;
      w: number;
      l: number;
      h: number;
      tilew: number;
      tilel: number;
      surfaces: {
        floor: horizontalShape,
        subfloor: horizontalShape,
        ceiling: horizontalShape,
        wall1?: verticalShape,
        wall2?: verticalShape,
        wall3?: verticalShape,
        wall4?: verticalShape,
      }
    }
}
  