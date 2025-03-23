// This file was auto-generated by prisma-generator-typescript-interfaces

import { JsonValue } from "./path/to/JsonValue.js"
import { NotBuiltIn } from "./path/to/NotBuiltIn.js"

export type Gender = "Male" | "Female" | "Other";

export type DataTest = "Apple" | "Banana" | "Orange" | "Pear";

export interface Person {
  id: NotBuiltIn;
  name: NotBuiltIn;
  age: NotBuiltIn;
  email: NotBuiltIn | null;
  gender: Gender;
  addressId: NotBuiltIn;
  address?: Address;
  friends?: Person[];
  friendsOf?: Person[];
  data?: Data | null;
}

export interface Address {
  id: NotBuiltIn;
  streetNumber: NotBuiltIn;
  streetName: NotBuiltIn;
  city: NotBuiltIn;
  isBilling: NotBuiltIn;
  people?: Person[];
}

export interface Data {
  id: NotBuiltIn;
  stringField: NotBuiltIn;
  booleanField: NotBuiltIn;
  intField: NotBuiltIn;
  floatField: NotBuiltIn;
  jsonField: JsonValue;
  dateField: JsonValue;
  bigIntField: JsonValue;
  decimalField: JsonValue;
  bytesField: JsonValue;
  enumField: DataTest;
  optionalStringField: NotBuiltIn | null;
  optionalBooleanField: NotBuiltIn | null;
  optionalIntField: NotBuiltIn | null;
  optionalFloatField: NotBuiltIn | null;
  optionalJsonField: JsonValue | null;
  optionalDateField: JsonValue | null;
  optionalBigIntField: JsonValue | null;
  optionalDecimalField: JsonValue | null;
  optionalBytesField: JsonValue | null;
  optionalEnumField: DataTest | null;
  stringArrayField: NotBuiltIn[];
  booleanArrayField: NotBuiltIn[];
  intArrayField: NotBuiltIn[];
  floatArrayField: NotBuiltIn[];
  jsonArrayField: JsonValue[];
  dateArrayField: JsonValue[];
  bigIntArrayField: JsonValue[];
  decimalArrayField: JsonValue[];
  bytesArrayField: JsonValue[];
  enumArrayField: DataTest[];
  personId: NotBuiltIn;
  person?: Person;
}
