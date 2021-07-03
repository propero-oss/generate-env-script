import { generateTemplate } from "src/ts/generate-template";
import { envJson } from "src/ts/parse-env";
import webpack, { Compilation, Compiler } from "webpack";

interface WebpackPluginGenerateEnvScriptOptions {
  prefixes?: string[];
  path?: string;
  name?: string;
  env?: typeof process.env;
  template?: string;
}

export const DefaultEnvPrefixes = ["NODE_MODULES", "NX_CUSTOM", "VUE_APP", "REACT_APP"];

export default class WebpackPluginGenerateEnvScript {
  options: Required<WebpackPluginGenerateEnvScriptOptions>;

  public constructor({
    prefixes = DefaultEnvPrefixes,
    path = "env.js",
    name = "process.env",
    env = process.env,
    template = "global-var",
  }: WebpackPluginGenerateEnvScriptOptions = {}) {
    this.options = { prefixes, path, name, env, template };
  }

  get name(): string {
    return "WebpackPluginGenerateEnvScript";
  }

  get version(): number {
    return parseInt(webpack.version);
  }

  public apply(compiler: Compiler): void {
    const { version, name } = this;
    if (version < 4) (compiler as any).plugin(name, this.createSourceFileAsync);
    else if (version === 4) compiler.hooks.emit.tapAsync(name, this.createSourceFileAsync as never);
    else compiler.hooks.thisCompilation.tap(name, (compilation) => {
      compilation.hooks.processAssets.tapPromise({
        name,
        stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
      }, this.createSourceFile.bind(this) as never);
    });
  }

  async createSourceFile(compilation: Compilation) {
    const { path } = this.options;
    const contents = await this.generateFileContents();
    if (this.version < 5) compilation.assets[path] = contents;
    else compilation.emitAsset(path, contents);
  }

  get createSourceFileAsync(): (compilation: Compilation, callback: (result: unknown) => void) => void {
    return (compilation, callback) => this.createSourceFile(compilation).then(callback).catch(callback);
  }

  async generateFileContents(): Promise<webpack.sources.Source> {
    const { prefixes, env, template, name, path } = this.options;
    const json = envJson(prefixes, env);
    const contents = await generateTemplate(template, { var: name, env: json, file: path });
    return new webpack.sources.RawSource(contents);
  }
}
