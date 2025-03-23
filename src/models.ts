import { DMMF } from "@prisma/generator-helper";
import { Config } from "./config.js";
import { CustomTypes } from "./customTypes.js";

/** Get the Typescript code representing a Prisma Model */
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
        `${resolvedType}${isList ? "[]" : ""}${!isRequired ? " | null" : ""};`;

      switch (kind) {
        case "scalar": {
          const tsType = customTypes.getTsType(type, isList || !isRequired);
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
