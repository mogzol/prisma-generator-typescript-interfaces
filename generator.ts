import { DMMF, generatorHandler } from "@prisma/generator-helper";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";
import { exec } from "child_process";

interface Config {
  enumType: "stringUnion" | "enum";
  enumSuffix: string;
  enumPrefix: string;
  modelSuffix: string;
  modelPrefix: string;
  dateType: "string" | "Date";
  bigIntType: "string" | "bigint";
  decimalType: "string" | "Decimal";
  bytesType: "Buffer" | "string";
  prettier: "true" | "false";
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
const CUSTOM_TYPES: Record<string, string> = {
  JsonValue:
    "type JsonValue = string | number | boolean | { [key in string]: JsonValue } | Array<JsonValue> | null;",
  Decimal: "interface Decimal {\n  valueOf(): string;\n}",
};

function validateConfig(config: Config) {
  const errors: string[] = [];
  if (!["stringUnion", "enum"].includes(config.enumType)) {
    errors.push(`Invalid enumType: ${config.enumType}`);
  }
  if (!["string", "Date"].includes(config.dateType)) {
    errors.push(`Invalid dateType: ${config.dateType}`);
  }
  if (!["string", "bigint"].includes(config.bigIntType)) {
    errors.push(`Invalid bigIntType: ${config.bigIntType}`);
  }
  if (!["string", "Decimal"].includes(config.decimalType)) {
    errors.push(`Invalid decimalType: ${config.decimalType}`);
  }
  if (!["Buffer", "string"].includes(config.bytesType)) {
    errors.push(`Invalid bytesType: ${config.bytesType}`);
  }
  if (!["true", "false"].includes(config.prettier)) {
    errors.push(`Invalid prettier: ${config.prettier}`);
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
  usedCustomTypes: Set<keyof typeof CUSTOM_TYPES>,
): string {
  const fields = modelData.fields
    .map(({ name, kind, type, isRequired, isList }) => {
      const getDefinition = (resolvedType: string) =>
        `  ${name}${isRequired ? "" : "?"}: ${resolvedType}${isList ? "[]" : ""};`;

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
          if (!modelName) {
            throw new Error(`Unknown model name: ${type}`);
          }
          return getDefinition(modelName);
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
    .join("\n");

  return `export interface ${modelNameMap.get(modelData.name)} {\n${fields}\n}`;
}

generatorHandler({
  onManifest() {
    return {
      prettyName: "Typescript Interfaces",
      defaultOutput: "interfaces.ts",
    };
  },
  async onGenerate(options) {
    const config: Config = {
      enumType: "enum",
      enumSuffix: "",
      enumPrefix: "",
      modelSuffix: "",
      modelPrefix: "",
      dateType: "Date",
      bigIntType: "bigint",
      decimalType: "Decimal",
      bytesType: "Buffer",
      prettier: "false",
      ...options.generator.config,
    };

    validateConfig(config);

    const datamodel = options.dmmf.datamodel;
    const enums = datamodel.enums;
    const models = datamodel.models;
    const usedCustomTypes = new Set<keyof typeof CUSTOM_TYPES>();

    const enumNameMap = new Map<string, string>(
      enums.map((e) => [e.name, `${config.enumPrefix}${e.name}${config.enumSuffix}`]),
    );
    const modelNameMap = new Map<string, string>(
      models.map((m) => [m.name, `${config.modelPrefix}${m.name}${config.modelSuffix}`]),
    );

    const enumsTs = enums.map((e) => getEnumTs(config, e, enumNameMap));
    const modelsTs = models.map((m) =>
      getModelTs(config, m, modelNameMap, enumNameMap, usedCustomTypes),
    );
    const customTypesTs = Array.from(usedCustomTypes).map((t) => CUSTOM_TYPES[t]);

    let ts = [...enumsTs, ...modelsTs, ...customTypesTs].join("\n\n") + "\n";

    if (config.prettier === "true") {
      // Prettier is imported inside this if so that it's not a required dependency
      let prettier: typeof import("prettier");
      try {
        prettier = await import("prettier");
      } catch (e) {
        throw new Error("Unable import Prettier. Is it installed?");
      }

      ts = await prettier.format(ts, { parser: "typescript" });
    }

    const outputFile = options.generator.output?.value as string;
    const outputDir = dirname(outputFile);
    await mkdir(outputDir, { recursive: true });
    await writeFile(outputFile, ts);

    if (config.prettier) {
      await promisify(exec)(`npx prettier --write ${outputFile}`);
    }
  },
});
