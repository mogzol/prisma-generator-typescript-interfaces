import generatorHelper from "@prisma/generator-helper";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { getConfig } from "./config.js";
import { CustomTypes } from "./customTypes.js";
import { getEnumTs } from "./enums.js";
import { getModelTs } from "./models.js";

// Due to how some versions of "@prisma/generator-helper" are built, there are issues if we try to
// import "generatorHandler" directly, so instead we import the default export and destructure it.
const { generatorHandler } = generatorHelper;

generatorHandler({
  onManifest() {
    return {
      prettyName: "Typescript Interfaces",
      defaultOutput: "interfaces.ts",
    };
  },
  async onGenerate(options) {
    const config = getConfig(options.generator.config);

    const datamodel = options.dmmf.datamodel;
    const models = datamodel.models;
    const enums = datamodel.enums;
    const types = datamodel.types;
    const customTypes = new CustomTypes(config);

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
      getModelTs(config, m, modelNameMap, enumNameMap, typeNameMap, customTypes),
    );
    const typeDefinitionsTs = customTypes.getTypeDefinitions();

    let ts = [...enumsTs, ...modelsTs, ...typeDefinitionsTs].join("\n\n") + "\n";

    const typeImportsTs = customTypes.getTypeImports();
    if (typeImportsTs.length) {
      ts = `${typeImportsTs.join("\n")}\n\n${ts}`;
    }

    if (config.headerComment) {
      const headerContent = config.headerComment
        .split("\n")
        .map((line) => `// ${line}`)
        .join("\n");
      ts = `${headerContent}\n\n${ts}`;
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
