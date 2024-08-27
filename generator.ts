import type { DMMF } from "@prisma/generator-helper";
import generatorHelper from "@prisma/generator-helper";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

// Need to use default export for ESM compatibility
const { generatorHandler } = generatorHelper;

interface Config {
  enumPrefix: string;
  enumSuffix: string;
  modelPrefix: string;
  modelSuffix: string;
  typePrefix: string;
  typeSuffix: string;
  headerComment: string;
  modelType: "interface" | "type";
  enumType: "stringUnion" | "enum" | "object";
  dateType: "Date" | "string" | "number";
  bigIntType: "bigint" | "string" | "number";
  decimalType: "Decimal" | "string" | "number";
  bytesType: "Buffer" | "BufferObject" | "string" | "number[]";
  optionalRelations: boolean;
  omitRelations: boolean;
  prettier: boolean;
}

// Map of Prisma scalar types to Typescript type getters
const SCALAR_TYPE_GETTERS: Record<string, (config: Config) => string> = {
  String: () => "string",
  Boolean: () => "boolean",
  Int: () => "number",
  Float: () => "number",
  Json: () => "JsonValue",
  DateTime: (config) => config.dateType,
  BigInt: (config) => config.bigIntType,
  Decimal: (config) => config.decimalType,
  Bytes: (config) => config.bytesType,
};

// Since we want the output to have zero dependencies, define custom types which are compatible
// with the actual Prisma types. If users need the real Prisma types, they can cast to them.
const CUSTOM_TYPES = {
  BufferObject: 'type BufferObject = { type: "Buffer"; data: number[] };',
  Decimal: "type Decimal = { valueOf(): string };",
  JsonValue:
    "type JsonValue = string | number | boolean | { [key in string]?: JsonValue } | Array<JsonValue> | null;",
};

function validateConfig(config: Config) {
  const errors: string[] = [];
  if (!["interface", "type"].includes(config.modelType)) {
    errors.push(`Invalid modelType: ${config.modelType}`);
  }
  if (!["stringUnion", "enum", "object"].includes(config.enumType)) {
    errors.push(`Invalid enumType: ${config.enumType}`);
  }
  if (!["Date", "string", "number"].includes(config.dateType)) {
    errors.push(`Invalid dateType: ${config.dateType}`);
  }
  if (!["bigint", "string", "number"].includes(config.bigIntType)) {
    errors.push(`Invalid bigIntType: ${config.bigIntType}`);
  }
  if (!["Decimal", "string", "number"].includes(config.decimalType)) {
    errors.push(`Invalid decimalType: ${config.decimalType}`);
  }
  if (!["Buffer", "BufferObject", "string", "number[]"].includes(config.bytesType)) {
    errors.push(`Invalid bytesType: ${config.bytesType}`);
  }
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}

// Get the Typescript code representing a Prisma Enum
function getEnumTs(
  config: Config,
  enumData: DMMF.DatamodelEnum,
  enumNameMap: Map<string, string>,
): string {
  switch (config.enumType) {
    case "enum": {
      const enumValues = enumData.values.map(({ name }) => `  ${name} = "${name}"`).join(",\n");
      return `export enum ${enumNameMap.get(enumData.name)} {\n${enumValues}\n}`;
    }
    case "stringUnion": {
      const enumValues = enumData.values.map(({ name }) => `"${name}"`).join(" | ");
      return `export type ${enumNameMap.get(enumData.name)} = ${enumValues};`;
    }
    case "object": {
      const enumValues = enumData.values.map(({ name }) => `  ${name}: "${name}"`).join(",\n");
      const enumName = enumNameMap.get(enumData.name);
      return `export const ${enumName} = {\n${enumValues}\n} as const;\n\nexport type ${enumName} = (typeof ${enumName})[keyof typeof ${enumName}];`;
    }
    default:
      throw new Error(`Unknown enumType: ${config.enumType}`);
  }
}

// Get the Typescript code representing a Prisma Model
function getModelTs(
  config: Config,
  modelData: DMMF.Model,
  modelNameMap: Map<string, string>,
  enumNameMap: Map<string, string>,
  typeNameMap: Map<string, string>,
  usedCustomTypes: Set<keyof typeof CUSTOM_TYPES>,
): string {
  const fields = modelData.fields
    .map(({ name, kind, type, isRequired, isList }) => {
      const getDefinition = (resolvedType: string, optional = false) =>
        `  ${name}${optional ? "?" : ""}: ${resolvedType}${isList ? "[]" : ""}${
          !isRequired ? " | null" : ""
        };`;

      switch (kind) {
        case "scalar": {
          const typeGetter = SCALAR_TYPE_GETTERS[type];
          if (!typeGetter) {
            throw new Error(`Unknown scalar type: ${type}`);
          }
          const resolvedType = typeGetter(config);
          if (resolvedType in CUSTOM_TYPES) {
            usedCustomTypes.add(resolvedType as keyof typeof CUSTOM_TYPES);
          }
          return getDefinition(resolvedType);
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

generatorHandler({
  onManifest() {
    return {
      prettyName: "Typescript Interfaces",
      defaultOutput: "interfaces.ts",
    };
  },
  async onGenerate(options) {
    const baseConfig = options.generator.config;
    const config: Config = {
      enumPrefix: "",
      enumSuffix: "",
      modelPrefix: "",
      modelSuffix: "",
      typePrefix: "",
      typeSuffix: "",
      headerComment: "This file was auto-generated by prisma-generator-typescript-interfaces",
      modelType: "interface",
      enumType: "stringUnion",
      dateType: "Date",
      bigIntType: "bigint",
      decimalType: "Decimal",
      bytesType: "Buffer",
      ...baseConfig,
      // Booleans go here since in the base config they are strings
      optionalRelations: baseConfig.optionalRelations !== "false", // Default true
      omitRelations: baseConfig.omitRelations === "true", // Default false
      prettier: baseConfig.prettier === "true", // Default false
    };

    validateConfig(config);

    const datamodel = options.dmmf.datamodel;
    const models = datamodel.models;
    const enums = datamodel.enums;
    const types = datamodel.types;

    const usedCustomTypes = new Set<keyof typeof CUSTOM_TYPES>();

    const enumNameMap = new Map<string, string>(
      enums.map((e) => [e.name, `${config.enumPrefix}${e.name}${config.enumSuffix}`]),
    );
    const modelNameMap = new Map<string, string>(
      models.map((m) => [m.name, `${config.modelPrefix}${m.name}${config.modelSuffix}`]),
    );
    const typeNameMap = new Map<string, string>(
      types.map((t) => [t.name, `${config.typePrefix}${t.name}${config.typeSuffix}`]),
    );

    const enumsTs = enums.map((e) => getEnumTs(config, e, enumNameMap));
    // Types and Models are essentially the same thing, so we can run both through getModelTs
    const modelsTs = [...models, ...types].map((m) =>
      getModelTs(config, m, modelNameMap, enumNameMap, typeNameMap, usedCustomTypes),
    );
    const customTypesTs = Array.from(usedCustomTypes).map((t) => CUSTOM_TYPES[t]);

    let ts = [...enumsTs, ...modelsTs, ...customTypesTs].join("\n\n") + "\n";

    if (config.headerComment) {
      const headerContent = config.headerComment
        .split("\n")
        .map((line) => `// ${line}`)
        .join("\n");
      ts = `${headerContent}\n\n${ts}`;
    }

    if (config.prettier) {
      // Prettier is imported inside this if so that it's not a required dependency
      let prettier: typeof import("prettier");
      try {
        prettier = await import("prettier");
      } catch {
        throw new Error("Unable import Prettier. Is it installed?");
      }

      ts = await prettier.format(ts, { parser: "typescript" });
    }

    const outputFile = options.generator.output?.value as string;
    const outputDir = dirname(outputFile);
    await mkdir(outputDir, { recursive: true });
    await writeFile(outputFile, ts);
  },
});
