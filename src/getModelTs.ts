import { DMMF } from "@prisma/generator-helper";
import { Config } from "./config.js";
import { CustomTypes } from "./customTypes.js";
import { documentationBlock, parseFieldDocumentation } from "./utils.js";

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
  const countNames: string[] = [];
  let fields = modelData.fields
    .map(({ name, kind, type, isRequired, hasDefaultValue, isList, documentation }) => {
      const getDefinition = (resolvedType: string, optional = false) => {
        const fieldDoc = parseFieldDocumentation(documentation);
        const fieldComment = config.includeComments
          ? documentationBlock(fieldDoc?.documentation, 2)
          : "";
        const isOptional =
          optional ||
          (!isRequired && config.optionalNullables) ||
          (hasDefaultValue && config.optionalDefaults);
        return (
          fieldComment +
          "  " +
          `${name}${isOptional ? "?" : ""}: ` +
          `${wrapComplex(resolvedType)}${isList ? "[]" : ""}${!isRequired ? " | null" : ""};`
        );
      };

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
            if (config.relations === "none") {
              return null;
            } else {
              if (isList) {
                countNames.push(name);
              }
              return getDefinition(modelName, config.relations === "optional");
            }
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

  if (config.counts !== "none" && countNames.length) {
    const sep = config.counts === "optional" ? "?:" : ":";
    const countFields = countNames.map((n) => `    ${n}${sep} number;`).join("\n");
    fields += `\n  _count${sep} {\n${countFields}\n  };`;
  }

  const name = modelNameMap.get(modelData.name) ?? typeNameMap.get(modelData.name);
  const documentation = config.includeComments ? documentationBlock(modelData.documentation) : "";

  switch (config.modelType) {
    case "interface":
      return `${documentation}export interface ${name} {\n${fields}\n}`;
    case "type":
      return `${documentation}export type ${name} = {\n${fields}\n};`;
    default:
      throw new Error(`Unknown modelType: ${config.modelType}`);
  }
}
