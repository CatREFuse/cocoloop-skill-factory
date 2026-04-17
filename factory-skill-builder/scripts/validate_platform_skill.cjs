#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const {
  SUPPORT_LEVELS,
  ensureArray,
  getDuplicatePlatforms,
  getTargetPlatforms,
  isKnownPlatform,
  isSupportedLevel,
  loadYamlFile,
} = require('./_spec_common.cjs');
const { parseFrontmatter, validateSkill } = require('./validate_skill.cjs');

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function tryLoadYamlFile(filePath, errors, label) {
  try {
    return loadYamlFile(filePath);
  } catch (error) {
    errors.push(`${label}: ${error.message}`);
    return null;
  }
}

function validateTargetPlatforms(spec, errors) {
  const targets = getTargetPlatforms(spec);
  const duplicates = getDuplicatePlatforms(spec);
  if (targets.length === 0) {
    errors.push('Spec must declare at least one target platform.');
    return;
  }
  if (duplicates.length > 0) {
    errors.push(`Spec declares duplicate target platforms: ${duplicates.join(', ')}`);
  }

  for (const target of targets) {
    if (!isKnownPlatform(target.platform)) {
      errors.push(`Unknown platform "${target.platform}" in spec target_platforms.`);
      continue;
    }
    if (!SUPPORT_LEVELS.includes(target.support_level)) {
      errors.push(
        `Platform "${target.platform}" uses unsupported support_level "${target.support_level}".`,
      );
    }
    if (isSupportedLevel(target.support_level)) {
      if (!target.standard_source) {
        errors.push(`Platform "${target.platform}" is missing standard_source.`);
      }
      if (!target.validation_mode) {
        errors.push(`Platform "${target.platform}" is missing validation_mode.`);
      }
      if (!target.publish_mode) {
        errors.push(`Platform "${target.platform}" is missing publish_mode.`);
      }
    }
  }
}

function validateSpecGate(spec, errors) {
  if (!String(spec?.primary_domain || '').trim()) {
    errors.push('Spec must declare primary_domain before rendering or packaging.');
  }
  if (!String(spec?.research_evidence?.coverage_status?.status || '').trim()) {
    errors.push('Spec must declare research_evidence.coverage_status.status before rendering or packaging.');
  }
  if (!Array.isArray(spec?.peer_domains)) {
    errors.push('Spec must declare peer_domains as an array before rendering or packaging.');
  }
  if (!Array.isArray(spec?.research_evidence?.open_gaps)) {
    errors.push('Spec must declare research_evidence.open_gaps as an array before rendering or packaging.');
  }
}

function validateCodex(skillDir, errors) {
  const filePath = path.join(skillDir, 'agents', 'openai.yaml');
  if (!fs.existsSync(filePath)) {
    return;
  }
  const manifest = tryLoadYamlFile(filePath, errors, 'agents/openai.yaml parse failed');
  if (!manifest) return;
  if (!manifest?.interface?.display_name) {
    errors.push('agents/openai.yaml is missing interface.display_name.');
  }
  if (!manifest?.interface?.short_description) {
    errors.push('agents/openai.yaml is missing interface.short_description.');
  }
}

function validateClaude(skillDir, errors) {
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  let frontmatter;
  try {
    frontmatter = parseFrontmatter(fs.readFileSync(skillMdPath, 'utf8'));
  } catch (error) {
    errors.push(`Claude Code frontmatter parse failed: ${error.message}`);
    return;
  }
  if (!frontmatter.when_to_use) {
    errors.push('Claude Code target requires when_to_use in SKILL.md frontmatter.');
  }
  if (
    frontmatter['allowed-tools'] !== undefined &&
    !Array.isArray(frontmatter['allowed-tools'])
  ) {
    errors.push('Claude Code frontmatter allowed-tools must be an array when present.');
  }
  if (
    frontmatter['user-invocable'] !== undefined &&
    typeof frontmatter['user-invocable'] !== 'boolean'
  ) {
    errors.push('Claude Code frontmatter user-invocable must be boolean when present.');
  }
}

function validateOpenClaw(skillDir, errors) {
  const filePath = path.join(skillDir, 'platform-manifests', 'openclaw-publish.yaml');
  if (!fs.existsSync(filePath)) {
    errors.push('OpenClaw target requires platform-manifests/openclaw-publish.yaml.');
    return;
  }
  const manifest = tryLoadYamlFile(
    filePath,
    errors,
    'OpenClaw publish manifest parse failed',
  );
  if (!manifest) return;
  for (const field of ['slug', 'name', 'version', 'publish_command', 'changelog']) {
    if (!manifest[field]) {
      errors.push(`OpenClaw publish manifest is missing ${field}.`);
    }
  }
  if (manifest.version && !SEMVER_RE.test(String(manifest.version))) {
    errors.push('OpenClaw publish manifest version must be semver.');
  }
  if (!Array.isArray(manifest.tags)) {
    errors.push('OpenClaw publish manifest requires tags array.');
  }
}

function validateHermes(skillDir, errors) {
  const filePath = path.join(skillDir, 'platform-manifests', 'hermes-agent.yaml');
  if (!fs.existsSync(filePath)) {
    errors.push('Hermes target requires platform-manifests/hermes-agent.yaml.');
    return;
  }
  const manifest = tryLoadYamlFile(filePath, errors, 'Hermes manifest parse failed');
  if (!manifest) return;
  for (const field of ['name', 'version', 'author']) {
    if (!manifest[field]) {
      errors.push(`Hermes manifest is missing ${field}.`);
    }
  }
  if (!Array.isArray(manifest.required_environment_variables)) {
    errors.push('Hermes manifest requires required_environment_variables array.');
  }
  if (!Array.isArray(manifest.required_credential_files)) {
    errors.push('Hermes manifest requires required_credential_files array.');
  }
  if (!Array.isArray(manifest.preflight_checks) || manifest.preflight_checks.length === 0) {
    errors.push('Hermes manifest requires preflight_checks array.');
  }
}

function validateCopaw(skillDir, errors) {
  const filePath = path.join(skillDir, 'platform-manifests', 'copaw-authoring.yaml');
  if (!fs.existsSync(filePath)) {
    errors.push('CoPaw target requires platform-manifests/copaw-authoring.yaml.');
    return;
  }
  const manifest = tryLoadYamlFile(filePath, errors, 'CoPaw manifest parse failed');
  if (!manifest) return;
  if (!Array.isArray(manifest.required_files) || !manifest.required_files.includes('SKILL.md')) {
    errors.push('CoPaw manifest must declare SKILL.md in required_files.');
  }
}

function validateMolili(skillDir, errors) {
  const filePath = path.join(skillDir, 'platform-manifests', 'molili-install.yaml');
  if (!fs.existsSync(filePath)) {
    errors.push('Molili target requires platform-manifests/molili-install.yaml.');
    return;
  }
  const manifest = tryLoadYamlFile(filePath, errors, 'Molili manifest parse failed');
  if (!manifest) return;
  for (const field of ['source_root', 'active_root', 'activation_strategy']) {
    if (!manifest[field]) {
      errors.push(`Molili install manifest is missing ${field}.`);
    }
  }
  if (!Array.isArray(manifest.verification_steps) || manifest.verification_steps.length === 0) {
    errors.push('Molili install manifest requires verification_steps.');
  }
}

function validatePlatformOutput(skillDir, specPath = null) {
  const result = validateSkill(skillDir);
  const errors = [];
  const warnings = [];

  if (!result.valid) {
    errors.push(result.message);
  }
  if (result.warning) {
    warnings.push(result.warning);
  }

  let resolvedSpecPath = specPath;
  if (!resolvedSpecPath) {
    const inferredSpecPath = path.join(skillDir, 'spec.yaml');
    if (fs.existsSync(inferredSpecPath)) {
      resolvedSpecPath = inferredSpecPath;
    } else {
      errors.push('Platform validation requires spec.yaml or an explicit --spec path.');
    }
  }

  let spec = null;
  if (resolvedSpecPath) {
    spec = tryLoadYamlFile(resolvedSpecPath, errors, 'Spec parse failed');
    if (spec) {
      validateTargetPlatforms(spec, errors);
      validateSpecGate(spec, errors);
    }
  }

  const skillMdPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(path.join(skillDir, 'references', 'spec-summary.md'))) {
    errors.push('Rendered skill is missing references/spec-summary.md.');
  }
  if (!fs.existsSync(path.join(skillDir, 'references', 'template-selection.md'))) {
    errors.push('Rendered skill is missing references/template-selection.md.');
  }
  if (!fs.existsSync(path.join(skillDir, 'spec.yaml'))) {
    errors.push('Rendered skill is missing spec.yaml copy.');
  }
  if (!fs.existsSync(skillMdPath)) {
    errors.push('Rendered skill is missing SKILL.md.');
  }

  if (spec) {
    for (const target of getTargetPlatforms(spec)) {
      switch (target.platform) {
        case 'codex':
          validateCodex(skillDir, errors);
          break;
        case 'claude_code':
          validateClaude(skillDir, errors);
          break;
        case 'openclaw':
          validateOpenClaw(skillDir, errors);
          break;
        case 'hermes_agent':
          validateHermes(skillDir, errors);
          break;
        case 'copaw':
          validateCopaw(skillDir, errors);
          break;
        case 'molili':
          validateMolili(skillDir, errors);
          break;
        default:
          errors.push(`No platform validator registered for "${target.platform}".`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error(
      'Usage: node validate_platform_skill.cjs <skill-directory> [--spec <spec.yaml>]',
    );
    process.exit(1);
  }

  const skillDir = path.resolve(args[0]);
  let specPath = null;
  for (let index = 1; index < args.length; index += 1) {
    if (args[index] === '--spec') {
      specPath = path.resolve(args[index + 1]);
      index += 1;
      continue;
    }
    console.error(`Unknown argument: ${args[index]}`);
    process.exit(1);
  }

  if (!specPath) {
    const inferredSpecPath = path.join(skillDir, 'spec.yaml');
    if (!fs.existsSync(inferredSpecPath)) {
      console.error(
        '❌ Platform validation requires spec.yaml. Pass --spec <spec.yaml> or validate a rendered skill directory that already contains spec.yaml.',
      );
      process.exit(1);
    }
    specPath = inferredSpecPath;
  }

  const result = validatePlatformOutput(skillDir, specPath);
  for (const warning of result.warnings) {
    console.warn(`⚠️  ${warning}`);
  }
  if (!result.valid) {
    for (const error of result.errors) {
      console.error(`❌ ${error}`);
    }
    process.exit(1);
  }
  console.log('✅ Platform validation passed.');
}

module.exports = { validatePlatformOutput };
