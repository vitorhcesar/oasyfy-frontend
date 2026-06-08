import { IColorField } from "./color-field.type";

export interface IColorGroup {
  title: string;
  icon: React.ElementType;
  fields: IColorField[];
}
