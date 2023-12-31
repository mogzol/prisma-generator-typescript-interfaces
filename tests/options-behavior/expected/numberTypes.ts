// This file was auto-generated by prisma-generator-typescript-interfaces

export type Gender = "Male" | "Female" | "Other";

export type DataTest = "Apple" | "Banana" | "Orange" | "Pear";

export interface Person {
  id: number;
  name: string;
  age: number;
  email: string | null;
  gender: Gender;
  addressId: number;
  address?: Address;
  friends?: Person[];
  friendsOf?: Person[];
  data?: Data | null;
}

export interface Address {
  id: number;
  streetNumber: number;
  streetName: string;
  city: string;
  isBilling: boolean;
  people?: Person[];
}

export interface Data {
  id: string;
  stringField: string;
  booleanField: boolean;
  intField: number;
  bigIntField: number;
  floatField: number;
  decimalField: number;
  dateField: number;
  jsonField: JsonValue;
  bytesField: number[];
  enumField: DataTest;
  optionalStringField: string | null;
  optionalBooleanField: boolean | null;
  optionalIntField: number | null;
  optionalBigIntField: number | null;
  optionalFloatField: number | null;
  optionalDecimalField: number | null;
  optionalDateField: number | null;
  optionalJsonField: JsonValue | null;
  optionalBytesField: number[] | null;
  optionalEnumField: DataTest | null;
  stringArrayField: string[];
  booleanArrayField: boolean[];
  intArrayField: number[];
  bigIntArrayField: number[];
  floatArrayField: number[];
  decimalArrayField: number[];
  dateArrayField: number[];
  jsonArrayField: JsonValue[];
  bytesArrayField: number[][];
  enumArrayField: DataTest[];
  personId: number;
  person?: Person;
}

type JsonValue = string | number | boolean | { [key in string]?: JsonValue } | Array<JsonValue> | null;
