export enum enumGenderEnum {
  Male = "Male",
  Female = "Female",
  Other = "Other"
}

export interface modelPersonModel {
  id: number;
  name: string;
  age: number;
  email?: string;
  gender: enumGenderEnum;
  addressId: number;
  address: modelAddressModel;
  friends: modelPersonModel[];
  friendsOf: modelPersonModel[];
  data?: modelDataModel;
}

export interface modelAddressModel {
  id: number;
  streetNumber: number;
  streetName: string;
  city: string;
  isBilling: boolean;
  people: modelPersonModel[];
}

export interface modelDataModel {
  id: string;
  stringField: string;
  booleanField: boolean;
  intField: number;
  bigIntField: bigint;
  floatField: number;
  decimalField: Decimal;
  dateField: Date;
  jsonField: JsonValue;
  bytesField: Buffer;
  optionalStringField?: string;
  optionalBooleanField?: boolean;
  optionalIntField?: number;
  optionalBigIntField?: bigint;
  optionalFloatField?: number;
  optionalDecimalField?: Decimal;
  optionalDateField?: Date;
  optionalJsonField?: JsonValue;
  optionalBytesField?: Buffer;
  stringArrayField: string[];
  booleanArrayField: boolean[];
  intArrayField: number[];
  bigIntArrayField: bigint[];
  floatArrayField: number[];
  decimalArrayField: Decimal[];
  dateArrayField: Date[];
  jsonArrayField: JsonValue[];
  bytesArrayField: Buffer[];
  personId: number;
  person: modelPersonModel;
}

interface Decimal {
  valueOf(): string;
}

type JsonValue = string | number | boolean | { [key in string]: JsonValue } | Array<JsonValue> | null;
