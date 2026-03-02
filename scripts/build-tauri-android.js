#!/usr/bin/env node

import { execSync } from "child_process";
import { existsSync, mkdirSync, rmSync } from "fs";
import { readdir, readFile } from "fs/promises";
import { homedir } from "os";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const tauriConfPath = resolve(root, "src-tauri/tauri.conf.json");
const releaseDir = resolve(
  root,
  "src-tauri/gen/android/app/build/outputs/apk/universal/release",
);
const tempDir = resolve(root, ".local-android");

function compareVersions(a, b) {
  const pa = a.split(".").map((v) => Number.parseInt(v, 10));
  const pb = b.split(".").map((v) => Number.parseInt(v, 10));
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av !== bv) {
      return av - bv;
    }
  }
  return 0;
}

async function findBuildToolsBinary(binaryName) {
  const sdkRoot =
    process.env.ANDROID_SDK_ROOT ||
    process.env.ANDROID_HOME ||
    resolve(homedir(), "Library/Android/sdk");

  const buildToolsDir = resolve(sdkRoot, "build-tools");
  if (!existsSync(buildToolsDir)) {
    throw new Error(
      `Android build-tools not found at ${buildToolsDir}. Set ANDROID_SDK_ROOT.`,
    );
  }

  const versions = await readdir(buildToolsDir);
  const sorted = versions.sort(compareVersions).reverse();
  for (const version of sorted) {
    const candidate = resolve(buildToolsDir, version, binaryName);
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Could not find ${binaryName} in ${buildToolsDir}`);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function getVersion() {
  const raw = await readFile(tauriConfPath, "utf-8");
  const config = JSON.parse(raw);
  return config.version;
}

async function main() {
  const keystorePath = requireEnv("ANDROID_KEYSTORE_PATH");
  const keyAlias = requireEnv("ANDROID_KEY_ALIAS");
  const keystorePassword = requireEnv("ANDROID_KEYSTORE_PASSWORD");
  const keyPassword = process.env.ANDROID_KEY_PASSWORD || keystorePassword;
  const target = process.env.TAURI_ANDROID_TARGET || "aarch64";

  if (!existsSync(keystorePath)) {
    throw new Error(`Keystore file not found: ${keystorePath}`);
  }

  const zipalign = await findBuildToolsBinary("zipalign");
  const apksigner = await findBuildToolsBinary("apksigner");
  const version = await getVersion();

  console.log("[tauri:build:android] Building static frontend for Tauri...");
  execSync("npm run build:tauri", { cwd: root, stdio: "inherit" });

  console.log(
    `[tauri:build:android] Building Android release APK (target=${target})...`,
  );
  execSync(`npx tauri android build --apk --target ${target}`, {
    cwd: root,
    stdio: "inherit",
  });

  const unsignedApk = resolve(releaseDir, "app-universal-release-unsigned.apk");
  if (!existsSync(unsignedApk)) {
    throw new Error(`Unsigned APK not found: ${unsignedApk}`);
  }

  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
  mkdirSync(tempDir, { recursive: true });

  const alignedApk = resolve(tempDir, `VFDashboard_${version}_aligned.apk`);
  const signedApk = resolve(
    releaseDir,
    `VFDashboard_${version}_aarch64_signed.apk`,
  );

  console.log("[tauri:build:android] Aligning APK...");
  execSync(`"${zipalign}" -f -p 4 "${unsignedApk}" "${alignedApk}"`, {
    cwd: root,
    stdio: "inherit",
  });

  console.log("[tauri:build:android] Signing APK...");
  execSync(
    `"${apksigner}" sign --ks "${keystorePath}" --ks-key-alias "${keyAlias}" --ks-pass pass:"${keystorePassword}" --key-pass pass:"${keyPassword}" --out "${signedApk}" "${alignedApk}"`,
    {
      cwd: root,
      stdio: "inherit",
    },
  );

  console.log("[tauri:build:android] Verifying signature...");
  execSync(`"${apksigner}" verify --verbose --print-certs "${signedApk}"`, {
    cwd: root,
    stdio: "inherit",
  });

  console.log(`[tauri:build:android] Signed APK: ${signedApk}`);
}

main().catch((error) => {
  console.error("[tauri:build:android] Build failed:", error.message);
  process.exit(1);
});
