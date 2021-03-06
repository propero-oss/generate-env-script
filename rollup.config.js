import sourcemaps from "rollup-plugin-sourcemaps";
import commonjs from "@rollup/plugin-commonjs";
import ts from "rollup-plugin-ts";
import paths from "rollup-plugin-ts-paths";
import nodeResolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";
import { keys, mapValues, upperFirst, camelCase, template } from "lodash";
import pkg from "./package.json";

const { dependencies } = pkg;
const formatModule = (name) => upperFirst(camelCase(name.indexOf("@") !== -1 ? name.split("/")[1] : name));
const yearRange = (date) => (new Date().getFullYear() === +date ? date : `${date} - ${new Date().getFullYear()}`);
const year = yearRange(pkg.since || new Date().getFullYear());
const external = keys(dependencies || {});
const globals = mapValues(dependencies || {}, (value, key) => formatModule(key));
const name = formatModule(pkg.name);
/* eslint-disable */
const banner = template(`
/**
 * <%= p.nameFormatted %> (<%= p.name %> v<%= p.version %>)
 * <%= p.description %>
 * <%= p.homepage %>
 * (c) <%= p.year %> <%= p.author %>
 * @license <%= p.license || "MIT" %>
 */
/* eslint-disable */`, { variable: "p" })({ ...pkg, nameFormatted: name, year }).trim();
/* eslint-enable */

const entries = [
  {
    name: "cli",
    dest: "bin",
    outputs: [{ format: "cjs" }]
  },
  {
    name: "rollup",
    outputs: [{ format: "esm" }]
  },
  {
    name: "webpack",
    outputs: [{ format: "cjs" }]
  },
  {
    name: "index",
    outputs: [
      { format: "cjs", suffix: ".cjs" },
      { format: "umd", suffix: ".umd" },
      { format: "esm" },
    ]
  }
];

export default entries.map(({ name: entry, dest = "dist", outputs }) => ({
  input: `src/ts/${entry}.ts`,
  output: outputs.map(({ format, suffix = "" }) => ({
    exports: "named",
    sourcemap: true,
    file: `${dest}/${entry}${suffix}.js`,
    format,
    globals,
    name,
    banner,
  })),
  external,
  plugins: [
    sourcemaps(),
    paths(),
    commonjs(),
    nodeResolve(),
    json({ compact: true }),
    ts({ tsconfig: "tsconfig.build.json" }),
    terser({ output: { comments: (node, comment) => /@preserve|@license|@cc_on/i.test(comment.value) } }),
  ],
}));
