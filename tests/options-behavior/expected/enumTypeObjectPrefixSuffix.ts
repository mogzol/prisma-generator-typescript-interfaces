export const eGenderEnum = {
  Male: "Male",
  Female: "Female",
  Other: "Other"
} satisfies Record<string, "Male" | "Female" | "Other">;

export type eGenderEnum = (typeof eGenderEnum)[keyof typeof eGenderEnum];

export const eDataTestEnum = {
  Apple: "Apple",
  Banana: "Banana",
  Orange: "Orange",
  Pear: "Pear"
} satisfies Record<string, "Apple" | "Banana" | "Orange" | "Pear">;

export type eDataTestEnum = (typeof eDataTestEnum)[keyof typeof eDataTestEnum];

export interface Person {
  id: number;
  name: string;
  age: number;
  email: string | null;
  gender: eGenderEnum;
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
  bigIntField: bigint;
  floatField: number;
  decimalField: Decimal;
  dateField: Date;
  jsonField: JsonValue;
  bytesField: Uint8Array;
  enumField: eDataTestEnum;
  optionalStringField: string | null;
  optionalBooleanField: boolean | null;
  optionalIntField: number | null;
  optionalBigIntField: bigint | null;
  optionalFloatField: number | null;
  optionalDecimalField: Decimal | null;
  optionalDateField: Date | null;
  optionalJsonField: JsonValue | null;
  optionalBytesField: Uint8Array | null;
  optionalEnumField: eDataTestEnum | null;
  stringArrayField: string[];
  booleanArrayField: boolean[];
  intArrayField: number[];
  bigIntArrayField: bigint[];
  floatArrayField: number[];
  decimalArrayField: Decimal[];
  dateArrayField: Date[];
  jsonArrayField: JsonValue[];
  bytesArrayField: Uint8Array[];
  enumArrayField: eDataTestEnum[];
  personId: number;
  person?: Person;
}

type Decimal = { valueOf(): string };

type JsonValue = string | number | boolean | { [key in string]?: JsonValue } | Array<JsonValue> | null;
