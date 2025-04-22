import type { GeneratorConfig, GeneratorOptions } from "@prisma/generator-helper";
import { stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export interface Config {
  schemaDir: string;
  outputDir: string;
  outputFile: string;

  enumPrefix: string;
  enumSuffix: string;
  enumObjectPrefix: string;
  enumObjectSuffix: string;
  modelPrefix: string;
  modelSuffix: string;
  typePrefix: string;
  typeSuffix: string;
  headerComment: string;
  modelType: "interface" | "type";
  enumType: "stringUnion" | "enum" | "object";

  stringType: string;
  booleanType: string;
  intType: string;
  floatType: string;
  jsonType: string;
  dateType: string;
  bigIntType: string;
  decimalType: string;
  bytesType: string;

  typeImportPath?: string;

  perFieldTypes: boolean;
  exportEnums: boolean;
  optionalRelations: boolean;
  omitRelations: boolean;
  optionalNullables: boolean;
  prettier: boolean;
  prettierConfigPath: string | null;
}

const STRING_CONFIGS: Array<keyof Config> = [
  "enumPrefix",
  "enumSuffix",
  "enumObjectPrefix",
  "enumObjectSuffix",
  "modelPrefix",
  "modelSuffix",
  "typePrefix",
  "typeSuffix",
  "headerComment",
];

const NONEMPTY_STRING_CONFIGS: Array<keyof Config> = [
  "schemaDir",
  "outputDir",
  "outputFile",
  "stringType",
  "booleanType",
  "intType",
  "floatType",
  "jsonType",
  "dateType",
  "bigIntType",
  "decimalType",
  "bytesType",
];

const BOOLEAN_CONFIGS: Array<keyof Config> = [
  "perFieldTypes",
  "exportEnums",
  "optionalRelations",
  "omitRelations",
  "optionalNullables",
  "prettier",
];

class ConfigValidator {
  public errors: string[] = [];

  constructor(private generatorConfig: GeneratorConfig["config"]) {}

  public async validate(config: Config): Promise<Config> {
    const { modelType, enumType, typeImportPath, prettierConfigPath, ...restConfig } = config;

    if (!["interface", "type"].includes(modelType)) {
      this.errors.push(`Invalid modelType: ${JSON.stringify(modelType)}`);
    }
    if (!["stringUnion", "enum", "object"].includes(enumType)) {
      this.errors.push(`Invalid enumType: ${JSON.stringify(enumType)}`);
    }
    if (typeImportPath !== undefined && (typeof typeImportPath !== "string" || !typeImportPath)) {
      this.errors.push(`Invalid typeImportPath: ${JSON.stringify(typeImportPath)}`);
    }
    if (config.prettier) {
      if (typeof prettierConfigPath !== "string") {
        this.errors.push(`Invalid prettierConfigPath: ${JSON.stringify(prettierConfigPath)}`);
      } else if (prettierConfigPath === "null") {
        // Convert string "null" to real null
        config.prettierConfigPath = null;
      } else if (prettierConfigPath !== "") {
        const fullPath = resolve(config.schemaDir, prettierConfigPath);
        const prettierConfigStat = await stat(fullPath).catch(() => null);
        if (!prettierConfigStat?.isFile()) {
          this.errors.push(`prettierConfigPath does not exist: "${fullPath}"`);
        } else {
          config.prettierConfigPath = fullPath;
        }
      }
    }

    for (const [name, value] of Object.entries(restConfig)) {
      let known = false;
      let valid = false;
      if (STRING_CONFIGS.includes(name as keyof Config)) {
        known = true;
        valid = typeof value === "string";
      } else if (NONEMPTY_STRING_CONFIGS.includes(name as keyof Config)) {
        known = true;
        valid = typeof value === "string" && Boolean(value.trim());
      } else if (BOOLEAN_CONFIGS.includes(name as keyof Config)) {
        known = true;
        valid = typeof value === "boolean";
      }

      if (!known) {
        this.errors.push(`Unknown config property: "${name}"`);
      } else if (!valid) {
        this.errors.push(`Invalid ${name}: ${JSON.stringify(value)}`);
      }
    }

    return config;
  }

  public boolean(name: keyof Config, defaultValue: boolean) {
    const value = this.generatorConfig[name];
    if (value === undefined) {
      return defaultValue;
    } else if (typeof value === "string") {
      const valueLower = value.toLowerCase();
      if (valueLower === "true") {
        return true;
      } else if (valueLower === "false") {
        return false;
      }
    }

    this.errors.push(`Invalid ${name}: ${JSON.stringify(value)}`);
    return defaultValue;
  }
}

export async function getConfig(options: GeneratorOptions): Promise<Config> {
  let schemaDir: string;
  const schemaStat = await stat(options.schemaPath);
  if (schemaStat.isDirectory()) {
    schemaDir = options.schemaPath;
  } else {
    schemaDir = dirname(options.schemaPath);
  }

  const outputFile = options.generator.output?.value as string;
  const outputDir = dirname(outputFile);

  const generatorConfig = options.generator.config;

  const validator = new ConfigValidator(generatorConfig);
  const config = await validator.validate({
    // Defaults
    enumPrefix: "",
    enumSuffix: "",
    enumObjectPrefix: "",
    enumObjectSuffix: "",
    modelPrefix: "",
    modelSuffix: "",
    typePrefix: "",
    typeSuffix: "",
    headerComment: "This file was auto-generated by prisma-generator-typescript-interfaces",
    modelType: "interface",
    enumType: "stringUnion",
    prettierConfigPath: "",

    // Default types
    stringType: "string",
    booleanType: "boolean",
    intType: "number",
    floatType: "number",
    jsonType: "JsonValue",
    dateType: "Date",
    bigIntType: "bigint",
    decimalType: "Decimal",
    bytesType: "Uint8Array",

    // User config
    ...generatorConfig,

    // Booleans come after since in generatorConfig they are strings
    perFieldTypes: validator.boolean("perFieldTypes", true),
    exportEnums: validator.boolean("exportEnums", true),
    optionalRelations: validator.boolean("optionalRelations", true),
    omitRelations: validator.boolean("omitRelations", false),
    optionalNullables: validator.boolean("optionalNullables", false),
    prettier: validator.boolean("prettier", false),

    // schemaDir, outputDir, and outputFile cannot be overridden
    schemaDir,
    outputDir,
    outputFile,
  });

  if (validator.errors.length) {
    throw new Error("Invalid config:\n - " + validator.errors.sort().join("\n - "));
  }

  return config;
}
