export type DataType = "float" | "int" | "bool" | "enum" | "curve" | "composite";

export interface MappingEntry {
  panel: string;
  setting: string;
  paths: string[];
  data_type: DataType;
  gui_values?: { min: number; max: number; unit?: string } | string[] | string | number | null;
  raw_range?: [number, number] | string | null;
  formula?: string | Record<string, (boolean | number | null)[]> | null;
  notes?: string | null;
}
