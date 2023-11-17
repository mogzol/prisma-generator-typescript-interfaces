export enum Gender {
  Male = "Male",
  Female = "Female",
  Other = "Other"
}

export interface Person {
  id: number;
  name: string;
  age: number;
  email: string | null;
  gender: Gender;
  addressId: number;
  address: Address;
  friends: Person[];
  friendsOf: Person[];
  data: Data | null;
}

export interface Address {
  id: number;
  streetNumber: number;
  streetName: string;
  city: string;
  isBilling: boolean;
  people: Person[];
}

export interface Data {
  id: string;
  stringField: string;
  booleanField: boolean;
  intField: number;
  bigIntField: string;
  floatField: number;
  decimalField: string;
  dateField: string;
  jsonField: JsonValue;
  bytesField: string;
  optionalStringField: string | null;
  optionalBooleanField: boolean | null;
  optionalIntField: number | null;
  optionalBigIntField: string | null;
  optionalFloatField: number | null;
  optionalDecimalField: string | null;
  optionalDateField: string | null;
  optionalJsonField: JsonValue | null;
  optionalBytesField: string | null;
  stringArrayField: string[];
  booleanArrayField: boolean[];
  intArrayField: number[];
  bigIntArrayField: string[];
  floatArrayField: number[];
  decimalArrayField: string[];
  dateArrayField: string[];
  jsonArrayField: JsonValue[];
  bytesArrayField: string[];
  personId: number;
  person: Person;
}

type JsonValue = string | number | boolean | { [key in string]: JsonValue } | Array<JsonValue> | null;
