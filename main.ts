import { cpSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const project = fileURLToPath(new URL('.', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const caps = { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 };

function verifyCaptureSet(folder) {
  const captures = readdirSync(folder).filter(name => !name.startsWith('.'));
  if (captures.length !== 4) throw new Error(`Expected four guide captures; found ${captures.length}.`);
  for (const name of captures) {
    const info = statSync(join(folder, name));
    if (!info.isFile() || info.size > 262144) throw new Error(`Screenshot is not a compliant image file: ${name}`);
  }
}

function prepareOutput() {
  mkdirSync(output, { recursive: true });
  cpSync(join(project, 'app'), join(output, 'app'), { recursive: true });
  verifyCaptureSet(join(project, 'screenshots'));
  cpSync(join(project, 'screenshots'), join(output, 'screenshots'), { recursive: true });
  const dossier = buildDossier(output, caps);
  writeFileSync(join(output, 'dossier.json'), dossier);
}

prepareOutput();
