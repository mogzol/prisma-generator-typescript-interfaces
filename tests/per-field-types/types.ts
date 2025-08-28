export type CustomFieldType = {
  test: { 0: "yes", 1: "maybe"}
}

export type OptionalCustomFieldType = {
  test2: { 0: "no", 1: "definitely"}
}

export type CustomArrayFieldType = [
  ["1","2"],
  ["3","4"]
]

export type JsonValue = unknown;
export type ImportedBoolean = boolean;
export type DefinedInt = number;
export type DateArrayType = Date[];
