import type { DMMF } from "@prisma/generator-helper";
import { Config } from "./config.js";

// Define some common custom types as built-in so that users don't need to manually define them.
const BUILTIN_CUSTOM_TYPES = {
  Decimal: "{ valueOf(): string }",
  JsonValue:
    "string | number | boolean | { [key in string]?: JsonValue } | Array<JsonValue> | null",
};

const importTypeRegex = /^import:([\w$]+)$/;
const definedTypeRegex = /^(?!import:)([\w$]+):(.+)$/;
const perFieldTypeRegex = /^\s*(!?)\[\s*([^\s].*)\]/;
const typeNameRegex = /^[\w$]+$/;

const localeSort = (a: string, b: string) => a.localeCompare(b);

interface CustomType {
  type: string;
  definition?: string;
  import?: boolean;
  unknown?: boolean;
}

class NotImportableError extends Error {}

export class CustomTypes {
  /** Map of Prisma scalar type to CustomTypes */
  private typeMap: { [type: string]: CustomType };

  /** Map of model fields to per-field CustomTypes */
  private perFieldTypeMap: { [key: string]: { customType: CustomType; literal: boolean } } = {};

  /** The CustomTypes that have been during generation */
  private usedTypes = new Set<CustomType>();

  /**
   * This cache is used to ensure that only one CustomType type exists per type name. Import types
   * take precedence over defined types, which take precedence over built-in types, which take
   * precedence over inline types.
   */
  private typeCache = new Map<string, CustomType>();

  private typeImportPath?: string;

  constructor(config: Config, datamodel: DMMF.Datamodel) {
    this.typeImportPath = config.typeImportPath;
    this.typeMap = {
      String: this.getCustomType(config.stringType),
      Boolean: this.getCustomType(config.booleanType),
      Int: this.getCustomType(config.intType),
      Float: this.getCustomType(config.floatType),
      Json: this.getCustomType(config.jsonType),
      DateTime: this.getCustomType(config.dateType),
      BigInt: this.getCustomType(config.bigIntType),
      Decimal: this.getCustomType(config.decimalType),
      Bytes: this.getCustomType(config.bytesType),
    };

    if (config.perFieldTypes) {
      this.preparePerFieldTypes(datamodel);
    }
  }

  /**
   * Enumerate the schema models to find all per-field custom types and add those types to
   * perFieldTypeMap. This MUST be done before the actual generation, as a field might use a type
   * that is defined/imported on a different field, so we need to loop through all fields first to
   * ensure we know of all the defined/imported types.
   */
  private preparePerFieldTypes(datamodel: DMMF.Datamodel) {
    for (const model of [...datamodel.models, ...datamodel.types]) {
      for (const { name, documentation } of model.fields) {
        // Check field documentation for a custom type
        const match = perFieldTypeRegex.exec(documentation ?? "");
        if (match?.[2]) {
          const literal = Boolean(match[1]);
          const typeString = match[2].trim();

          let customType: CustomType;
          try {
            customType = this.getCustomType(typeString, !literal);
          } catch (e) {
            if (e instanceof NotImportableError) {
              throw new Error(
                `${model.name}.${name} has an invalid custom type: [${typeString}]\nIf this was meant to be a literal type, add an exclamation point: ![${typeString}]`,
              );
            }
            throw e;
          }

          if (customType.import && !this.typeImportPath) {
            throw new Error(
              `${model.name}.${name} has custom type '[${typeString}]' which must be imported, but typeImportPath is not set!`,
            );
          }

          this.perFieldTypeMap[`${model.name}.${name}`] = { customType, literal };
        }
      }
    }
  }

  private upsertCachedType(customType: CustomType) {
    const cached = this.typeCache.get(customType.type);
    if (!cached) {
      this.typeCache.set(customType.type, customType);
      return customType;
    }

    // Unknown types have the lowest priority, they will always be overridden.
    // Import types have the highest priority, they will always override a cached type.
    // Defined types will only override a cached type if the cached type is not an import.
    if (
      cached.unknown ||
      (!customType.unknown && (customType.import || (customType.definition && !cached.import)))
    ) {
      // Update the existing object
      cached.definition = customType.definition;
      cached.import = customType.import;
      cached.unknown = false;
    }

    return cached;
  }

  /**
   * Get a CustomType from a type config string.
   * @param importUnknown Use an import type instead of an inline type for unknown types
   */
  private getCustomType(configType: string, importUnknown = false): CustomType {
    const definedMatch = definedTypeRegex.exec(configType);
    if (definedMatch) {
      return this.upsertCachedType({
        type: definedMatch[1],
        definition: definedMatch[2],
      });
    }

    const importMatch = importTypeRegex.exec(configType);
    if (importMatch) {
      if (!this.typeImportPath) {
        throw new Error(`Type '${configType}' requires an import, but typeImportPath is not set!`);
      }

      return this.upsertCachedType({
        type: importMatch[1],
        import: true,
      });
    }

    // If we get here and importUnknown is true, the type should just be a type name
    if (importUnknown && !typeNameRegex.test(configType)) {
      throw new NotImportableError();
    }

    const builtIn = BUILTIN_CUSTOM_TYPES[configType as keyof typeof BUILTIN_CUSTOM_TYPES];
    return this.upsertCachedType({
      type: configType,
      definition: builtIn,
      unknown: true,
      import: importUnknown && !builtIn,
    });
  }

  /** Get the TypeScript type for a per-field custom type. */
  public getPerFieldCustomType(modelName: string, fieldName: string) {
    const perFieldType = this.perFieldTypeMap[`${modelName}.${fieldName}`];
    if (!perFieldType) {
      return null;
    }

    this.usedTypes.add(perFieldType.customType);
    return {
      tsType: perFieldType.customType.type,
      literal: perFieldType.literal,
    };
  }

  /** Get the TypeScript type from a Prisma scalar type. */
  public getType(prismaType: string): string {
    const customType = this.typeMap[prismaType];
    if (!customType) {
      throw new Error(`Unknown scalar type: ${prismaType}`);
    }

    this.usedTypes.add(customType);
    return customType.type;
  }

  /** Get the TypeScript import statement for all used types */
  public getTypeImports(): string | null {
    const importTypes = Array.from(this.usedTypes)
      .filter((t) => t.import)
      .map((t) => t.type);

    if (!importTypes.length) {
      return null;
    } else if (!this.typeImportPath) {
      throw new Error("Type imports exist, but typeImportPath is not set!");
    }

    return `import { ${importTypes.sort(localeSort).join(", ")} } from "${this.typeImportPath}";`;
  }

  /** Get the TypeScript type definitions for used types */
  public getTypeDefinitions(): string[] {
    return Array.from(this.usedTypes)
      .filter((t) => t.definition !== undefined)
      .map((t) => `type ${t.type} = ${t.definition};`);
  }
}
