import { DMMF } from "@prisma/generator-helper";
import { Config } from "./config.js";
import { CustomTypes } from "./customTypes.js";

// A type is considered complex if contains a union (|), intersection (&), conditional (?), or
// function (=>) anywhere in the type. This will catch cases that don't necessarily need to be
// marked complex, such as "Record<string, string | number>", but it doesn't cause any harm to wrap
// those in parenthesis, and detecting and excluding all such cases would be too complex.
const complexTypeRegex = /[|&?]|=>/;

/** Get the TypeScript code representing a Prisma Model */
export function getModelTs(
  config: Config,
  modelData: DMMF.Model,
  modelNameMap: Map<string, string>,
  enumNameMap: Map<string, string>,
  typeNameMap: Map<string, string>,
  customTypes: CustomTypes,
): string {
  const fields = modelData.fields
    .map(({ name, kind, type, isRequired, isList }) => {
      const getDefinition = (resolvedType: string, optional = false) =>
        "  " +
        `${name}${optional || (!isRequired && config.optionalNullables) ? "?" : ""}: ` +
        `${wrapComplex(resolvedType)}${isList ? "[]" : ""}${!isRequired ? " | null" : ""};`;

      // When creating definitions for lists or nullable fields, complex types need to be wrapped
      // in parenthesis so that they end up like `(string | number)[]` or `(() => string) | null`
      // and not like `string | number[]` or `() => string | null`
      const wrapComplex = (resolvedType: string) =>
        (isList || !isRequired) && complexTypeRegex.test(resolvedType)
          ? `(${resolvedType})`
          : resolvedType;

      // Check for a per-field custom type for this field, and use it if it exists
      const customType = customTypes.getPerFieldCustomType(modelData.name, name);
      if (customType) {
        if (customType.literal) {
          isList = false; // Set isList to false since we don't want to add '[]' to literal types
        }
        return getDefinition(customType.tsType);
      }

      switch (kind) {
        case "scalar": {
          const tsType = customTypes.getType(type);
          return getDefinition(tsType);
        }
        case "object": {
          const modelName = modelNameMap.get(type);
          const typeName = typeNameMap.get(type);
          if (typeName) {
            return getDefinition(typeName); // Type relations are never optional or omitted
          } else if (modelName) {
            return config.omitRelations ? null : getDefinition(modelName, config.optionalRelations);
          } else {
            throw new Error(`Unknown model name: ${type}`);
          }
        }
        case "enum": {
          const enumName = enumNameMap.get(type);
          if (!enumName) {
            throw new Error(`Unknown enum name: ${type}`);
          }
          return getDefinition(enumName);
        }
        case "unsupported":
          return getDefinition("any");
        default:
          throw new Error(`Unknown field kind: ${kind}`);
      }
    })
    .filter((f) => f !== null)
    .join("\n");

  const name = modelNameMap.get(modelData.name) ?? typeNameMap.get(modelData.name);

  switch (config.modelType) {
    case "interface":
      return `export interface ${name} {\n${fields}\n}`;
    case "type":
      return `export type ${name} = {\n${fields}\n};`;
    default:
      throw new Error(`Unknown modelType: ${config.modelType}`);
  }
}
