const { spawn } = require("child_process")
const { resolve } = require("path");

function goEnv(os, arch) {
  return {
    ...process.env,
    GOOS: os,
    GOARCH: arch,
    CGO_ENABLED: "0",
    // GOROOT: resolve("."),
  };
}

const buildFlags = [
  "-trimpath"
]

function buildBinary({ os, arch, ext = "" }) {
  return new Promise((resolve, reject) => {
    const env = goEnv(os, arch);
    const proc = spawn("go", [
      "build",
      ...buildFlags,
      "-o",
      `bin/generate-env-script-${os}-${arch}${ext}`,
      "src/go/main.go"
    ], {
      env,
      cwd: resolve("."),
      shell: false,
      stdio: "inherit"
    }, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

function main() {
  const targets = [
    { os: "linux", arch: "amd64" },
    { os: "linux", arch: "386" },
    { os: "windows", arch: "amd64", ext: ".exe" },
    { os: "windows", arch: "386", ext: ".exe" },
  ];
  return Promise.all(targets.map(buildBinary));
}

main();
