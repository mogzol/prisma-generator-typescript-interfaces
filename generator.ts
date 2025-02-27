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
  modelType: "interface" | "type" | "class";
  enumType: "stringUnion" | "enum" | "object";
  dateType: "Date" | "string" | "number";
  bigIntType: "bigint" | "string" | "number";
  decimalType: "Decimal" | "string" | "number";
  bytesType: "Buffer" | "BufferObject" | "string" | "number[]";
  optionalRelations: boolean;
  omitRelations: boolean;
  optionalNullables: boolean;
  prettier: boolean;
  resolvePrettierConfig: boolean;
  nestjsSwagger: boolean;
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
  if (!["interface", "type", "class"].includes(config.modelType)) {
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
  if (config.nestjsSwagger && config.modelType !== "class") {
    errors.push(`nestjsSwagger can only be used with modelType: "class"`);
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
  enums: DMMF.DatamodelEnum[],
): string {
  const fields = modelData.fields
    .map(({ name, kind, type, isRequired, isList }) => {
      // 添加ApiProperty装饰器的函数
      const getApiPropertyDecorator = (resolvedType: string, isEnum = false) => {
        if (!config.nestjsSwagger || config.modelType !== "class") return "";

        const options: string[] = [];

        // 处理类型
        if (isEnum) {
          // 添加枚举值
          const enumName = enumNameMap.get(type);
          if (enumName) {
            if (config.enumType === "stringUnion") {
              // 对于字符串联合类型，我们需要提供枚举值
              const enumData = enums.find((e) => e.name === type);
              const enumValues = enumData
                ? `[${enumData.values.map((v) => `'${v.name}'`).join(", ")}]`
                : `Object.values(${enumName})`;
              options.push(`enumName: '${enumName}'`);
              options.push(`enum: ${enumValues}`);
            } else {
              options.push(`enum: ${enumName}`);
            }
          }

          // 对于枚举数组，添加isArray选项
          if (isList) {
            options.push("isArray: true");
          }

          return `  @ApiProperty(${options.length ? `{ ${options.join(", ")} }` : ""})\n`;
        }

        // 处理是否必需
        if (isRequired) {
          options.push("required: true");
        } else {
          options.push("required: false");
        }

        // 处理数组类型
        if (isList) {
          options.push("isArray: true");
        }

        // 处理特殊类型
        if (resolvedType === "Decimal" || config.decimalType === "Decimal") {
          // 对于Decimal类型，使用string
          options.push(`type: 'string'`);
        } else if (resolvedType === "bigint") {
          // 对于BigInt类型，使用string
          options.push(`type: 'BigInt'`);
        } else if (
          resolvedType !== "string" &&
          resolvedType !== "number" &&
          resolvedType !== "boolean" &&
          resolvedType !== "JsonValue"
        ) {
          // 对于其他非基本类型，使用type选项
          options.push(`type: () => ${resolvedType}`);
        }

        return `  @ApiProperty(${options.length ? `{ ${options.join(", ")} }` : ""})\n`;
      };

      const getDefinition = (resolvedType: string, optional = false, isEnum = false) => {
        const apiPropertyDecorator = getApiPropertyDecorator(resolvedType, isEnum);
        return (
          apiPropertyDecorator +
          "  " +
          `${name}${optional || (!isRequired && config.optionalNullables) ? "?" : ""}: ` +
          `${resolvedType}${isList ? "[]" : ""}${!isRequired ? " | null" : ""};`
        );
      };

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
          return getDefinition(enumName, false, true);
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
    case "class":
      return `export class ${name} {\n${fields}\n}`;
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
      optionalNullables: baseConfig.optionalNullables === "true", // Default false
      prettier: baseConfig.prettier === "true", // Default false
      resolvePrettierConfig: baseConfig.resolvePrettierConfig !== "false", // Default true
      nestjsSwagger: baseConfig.nestjsSwagger === "true", // Default false
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
      getModelTs(
        config,
        m,
        modelNameMap,
        enumNameMap,
        typeNameMap,
        usedCustomTypes,
        enums as DMMF.DatamodelEnum[],
      ),
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

    // 当nestjsSwagger为true时，添加ApiProperty的导入语句和自定义类型
    if (config.nestjsSwagger && config.modelType === "class") {
      // 添加ApiProperty导入
      let imports = `import { ApiProperty } from "@nestjs/swagger";\n\n`;

      // 添加自定义类型定义到文件顶部
      if (usedCustomTypes.size > 0) {
        const customTypesDefinitions = Array.from(usedCustomTypes)
          .map((t) => CUSTOM_TYPES[t])
          .join("\n\n");
        imports += `${customTypesDefinitions}\n\n`;

        // 从ts中移除自定义类型，因为已经添加到顶部了
        Array.from(usedCustomTypes).forEach((type) => {
          const typeDefinition = CUSTOM_TYPES[type];
          ts = ts.replace(typeDefinition, "");
        });
      }

      ts = imports + ts;
    }

    const outputFile = options.generator.output?.value as string;
    const outputDir = dirname(outputFile);

    if (config.prettier) {
      // Prettier is imported inside this if so that it's not a required dependency
      let prettier: typeof import("prettier");
      try {
        prettier = await import("prettier");
      } catch {
        throw new Error("Unable import Prettier. Is it installed?");
      }

      const prettierOptions = config.resolvePrettierConfig
        ? await prettier.resolveConfig(outputFile)
        : null;

      ts = await prettier.format(ts, { ...prettierOptions, parser: "typescript" });
    }

    await mkdir(outputDir, { recursive: true });
    await writeFile(outputFile, ts);
  },
});
