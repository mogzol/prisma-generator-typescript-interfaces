interface Decimal {
  valueOf(): string;
}

type JsonValue =
  | string
  | number
  | boolean
  | { [key in string]: JsonValue }
  | Array<JsonValue>
  | null;

export enum Gender {
  Male = "Male",
  Female = "Female",
  Other = "Other",
}

export interface Person {
  id: number;
  name: string;
  age: number;
  email?: string;
  gender: Gender;
  addressId: number;
  address: Address;
  friends: Person[];
  friendsOf: Person[];
  data?: Data;
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
  bigIntField: BigInt;
  floatField: number;
  decimalField: Decimal;
  dateField: Date;
  jsonField: JsonValue;
  bytesField: Buffer;
  optionalStringField?: string;
  optionalBooleanField?: boolean;
  optionalIntField?: number;
  optionalBigIntField?: BigInt;
  optionalFloatField?: number;
  optionalDecimalField?: Decimal;
  optionalDateField?: Date;
  optionalJsonField?: JsonValue;
  optionalBytesField?: Buffer;
  stringArrayField: string[];
  booleanArrayField: boolean[];
  intArrayField: number[];
  bigIntArrayField: BigInt[];
  floatArrayField: number[];
  decimalArrayField: Decimal[];
  dateArrayField: Date[];
  jsonArrayField: JsonValue[];
  bytesArrayField: Buffer[];
  personId: number;
  person: Person;
}
