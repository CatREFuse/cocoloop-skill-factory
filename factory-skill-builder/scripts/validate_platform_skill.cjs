#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const {
  SUPPORT_LEVELS,
  ensureArray,
  getDuplicatePlatforms,
  getDisplayName,
  getSkillSlug,
  getTargetPlatforms,
  isValidSkillSlug,
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
  const researchContract = spec?.interaction_contract?.research;
  const outputProfile = spec?.output_profile || {};
  const skillIdentityGate = spec?.research_gate?.skill_identity;
  const targetEnvironmentGate = spec?.research_gate?.target_environment;
  const implementationApproachGate = spec?.research_gate?.implementation_approach;
  const allowedGateStatuses = new Set(['blocked', 'caution', 'ready']);
  const allowedExecutionPlanes = new Set([
    'Skill-only',
    'Skill + CLI',
    'Skill + API/MCP',
    'Skill + CLI + API/MCP',
  ]);
  if (!String(spec?.skill_identity?.slug || '').trim()) {
    errors.push('Spec must declare skill_identity.slug before rendering or packaging.');
  } else if (!isValidSkillSlug(spec.skill_identity.slug)) {
    errors.push(
      'Spec skill_identity.slug must use lowercase English letters, digits, and hyphen separators only.',
    );
  }
  if (!String(spec?.skill_identity?.display_name || '').trim()) {
    errors.push('Spec must declare skill_identity.display_name before rendering or packaging.');
  } else if (getDisplayName(spec).length > 20) {
    errors.push('Spec skill_identity.display_name must not exceed 20 characters.');
  }
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
  if (typeof outputProfile.has_visual_output !== 'boolean') {
    errors.push('Spec output_profile.has_visual_output must be boolean before rendering or packaging.');
  }
  if (!Array.isArray(outputProfile.visual_output_types)) {
    errors.push('Spec output_profile.visual_output_types must be an array before rendering or packaging.');
  }
  if (!skillIdentityGate) {
    errors.push('Spec must declare research_gate.skill_identity before rendering or packaging.');
  } else {
    if (!allowedGateStatuses.has(String(skillIdentityGate.status || '').trim())) {
      errors.push('Spec research_gate.skill_identity.status must be blocked, caution, or ready.');
    } else if (String(skillIdentityGate.status || '').trim() !== 'ready') {
      errors.push('Spec research_gate.skill_identity.status must be ready before rendering or packaging.');
    }
    if (typeof skillIdentityGate.cocoloop_checked !== 'boolean') {
      errors.push('Spec research_gate.skill_identity.cocoloop_checked must be boolean.');
    } else if (skillIdentityGate.cocoloop_checked !== true) {
      errors.push('Spec research_gate.skill_identity.cocoloop_checked must be true before rendering or packaging.');
    }
    if (typeof skillIdentityGate.clawhub_checked !== 'boolean') {
      errors.push('Spec research_gate.skill_identity.clawhub_checked must be boolean.');
    } else if (skillIdentityGate.clawhub_checked !== true) {
      errors.push('Spec research_gate.skill_identity.clawhub_checked must be true before rendering or packaging.');
    }
    if (typeof skillIdentityGate.slug_available !== 'boolean') {
      errors.push('Spec research_gate.skill_identity.slug_available must be boolean.');
    } else if (skillIdentityGate.slug_available !== true) {
      errors.push('Spec research_gate.skill_identity.slug_available must be true before rendering or packaging.');
    }
  }
  if (!targetEnvironmentGate) {
    errors.push('Spec must declare research_gate.target_environment before rendering or packaging.');
  } else {
    if (!allowedGateStatuses.has(String(targetEnvironmentGate.status || '').trim())) {
      errors.push('Spec research_gate.target_environment.status must be blocked, caution, or ready.');
    } else if (String(targetEnvironmentGate.status || '').trim() !== 'ready') {
      errors.push('Spec research_gate.target_environment.status must be ready before rendering or packaging.');
    }
    if (!String(targetEnvironmentGate.current_environment || '').trim()) {
      errors.push('Spec research_gate.target_environment.current_environment is required before rendering or packaging.');
    }
    if (!String(targetEnvironmentGate.target_environment || '').trim()) {
      errors.push('Spec research_gate.target_environment.target_environment is required before rendering or packaging.');
    }
    if (typeof targetEnvironmentGate.current_environment_is_target !== 'boolean') {
      errors.push('Spec research_gate.target_environment.current_environment_is_target must be boolean.');
    }
  }
  if (!implementationApproachGate) {
    errors.push('Spec must declare research_gate.implementation_approach before rendering or packaging.');
  } else {
    if (!allowedGateStatuses.has(String(implementationApproachGate.status || '').trim())) {
      errors.push('Spec research_gate.implementation_approach.status must be blocked, caution, or ready.');
    } else if (String(implementationApproachGate.status || '').trim() !== 'ready') {
      errors.push('Spec research_gate.implementation_approach.status must be ready before rendering or packaging.');
    }
    if (!allowedExecutionPlanes.has(String(implementationApproachGate.selected_execution_plane || '').trim())) {
      errors.push(
        'Spec research_gate.implementation_approach.selected_execution_plane must be one of Skill-only, Skill + CLI, Skill + API/MCP, or Skill + CLI + API/MCP.',
      );
    }
  }
  if (researchContract) {
    if (researchContract.ask_one_question_per_turn !== undefined &&
        typeof researchContract.ask_one_question_per_turn !== 'boolean') {
      errors.push('Spec interaction_contract.research.ask_one_question_per_turn must be boolean when present.');
    }
    if (researchContract.count_confirmation_questions !== undefined &&
        typeof researchContract.count_confirmation_questions !== 'boolean') {
      errors.push('Spec interaction_contract.research.count_confirmation_questions must be boolean when present.');
    }
    if (researchContract.detect_current_environment_first !== undefined &&
        typeof researchContract.detect_current_environment_first !== 'boolean') {
      errors.push('Spec interaction_contract.research.detect_current_environment_first must be boolean when present.');
    }
    if (researchContract.confirm_target_environment_before_writing !== undefined &&
        typeof researchContract.confirm_target_environment_before_writing !== 'boolean') {
      errors.push('Spec interaction_contract.research.confirm_target_environment_before_writing must be boolean when present.');
    }
    if (researchContract.max_questions !== undefined) {
      if (!Number.isInteger(researchContract.max_questions) || researchContract.max_questions <= 0) {
        errors.push('Spec interaction_contract.research.max_questions must be a positive integer when present.');
      } else if (researchContract.max_questions > 10) {
        errors.push('Spec interaction_contract.research.max_questions must not exceed 10 for the current factory rules.');
      }
    }
    if (researchContract.overflow_strategy !== undefined &&
        !String(researchContract.overflow_strategy || '').trim()) {
      errors.push('Spec interaction_contract.research.overflow_strategy must be a non-empty string when present.');
    }
  }
  if (spec?.design_md?.enabled) {
    if (!String(spec.design_md.source_mode || '').trim()) {
      errors.push('Spec must declare design_md.source_mode when design_md.enabled is true.');
    }
    if (!Array.isArray(spec.design_md.applies_to)) {
      errors.push('Spec must declare design_md.applies_to as an array when design_md.enabled is true.');
    }
    if (
      spec.design_md.source_mode === 'preset' &&
      !String(spec.design_md.preset_id || '').trim()
    ) {
      errors.push('Spec must declare design_md.preset_id when design_md.source_mode is preset.');
    }
    if (
      spec.design_md.source_mode === 'user_provided' &&
      !String(spec.design_md.user_provided_ref || '').trim()
    ) {
      errors.push(
        'Spec must declare design_md.user_provided_ref when design_md.source_mode is user_provided.',
      );
    }
  }
  if (outputProfile.has_visual_output && !spec?.design_md?.enabled) {
    errors.push('Spec with output_profile.has_visual_output=true must also enable design_md.');
  }
  if (spec?.visual_storytelling?.enabled) {
    if (!String(spec.visual_storytelling.artifact_family || '').trim()) {
      errors.push(
        'Spec must declare visual_storytelling.artifact_family when visual_storytelling.enabled is true.',
      );
    }
    if (!Array.isArray(spec.visual_storytelling.story_units) || spec.visual_storytelling.story_units.length === 0) {
      errors.push(
        'Spec must declare visual_storytelling.story_units as a non-empty array when visual_storytelling.enabled is true.',
      );
    }
    if (
      !Array.isArray(spec.visual_storytelling.output_adapters) ||
      spec.visual_storytelling.output_adapters.length === 0
    ) {
      errors.push(
        'Spec must declare visual_storytelling.output_adapters as a non-empty array when visual_storytelling.enabled is true.',
      );
    }
    if (
      !Array.isArray(spec?.visual_storytelling?.text_hierarchy?.required_layers) ||
      spec.visual_storytelling.text_hierarchy.required_layers.length === 0
    ) {
      errors.push(
        'Spec must declare visual_storytelling.text_hierarchy.required_layers as a non-empty array when visual_storytelling.enabled is true.',
      );
    }
  }
}

function validateGeneratedByCocoloop(frontmatter, errors) {
  if (frontmatter.generated_by_cocoloop !== true) {
    errors.push(
      'Factory-rendered SKILL.md frontmatter must include generated_by_cocoloop: true.',
    );
  }
}

function validateCodex(skillDir, errors, spec = null) {
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
  if (
    spec &&
    manifest?.interface?.display_name &&
    manifest.interface.display_name !== getDisplayName(spec)
  ) {
    errors.push('agents/openai.yaml interface.display_name must match spec skill_identity.display_name.');
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

function validateOpenClaw(skillDir, errors, spec = null) {
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
  if (spec && manifest.slug && manifest.slug !== getSkillSlug(spec)) {
    errors.push('OpenClaw publish manifest slug must match spec skill_identity.slug.');
  }
  if (spec && manifest.name && manifest.name !== getDisplayName(spec)) {
    errors.push('OpenClaw publish manifest name must match spec skill_identity.display_name.');
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
  } else {
    try {
      const frontmatter = parseFrontmatter(fs.readFileSync(skillMdPath, 'utf8'));
      validateGeneratedByCocoloop(frontmatter, errors);
    } catch (error) {
      errors.push(`Rendered SKILL.md frontmatter parse failed: ${error.message}`);
    }
  }

  if (spec) {
    if (spec?.design_md?.enabled) {
      const designEntry = path.join(
        skillDir,
        spec.design_md.output_path || 'references/design.md',
      );
      if (!fs.existsSync(designEntry)) {
        errors.push(`Rendered skill is missing ${path.relative(skillDir, designEntry)}.`);
      }
      if (!fs.existsSync(path.join(skillDir, 'references', 'design-md', 'index.md'))) {
        errors.push('Rendered skill is missing references/design-md/index.md.');
      }
      if (!fs.existsSync(path.join(skillDir, 'references', 'design-selection.md'))) {
        errors.push('Rendered skill is missing references/design-selection.md.');
      }
    }
    if (spec?.output_profile?.has_visual_output === true) {
      if (!fs.existsSync(path.join(skillDir, 'references', 'design.md'))) {
        errors.push('Rendered skill with visual output is missing references/design.md.');
      }
      if (!fs.existsSync(path.join(skillDir, 'references', 'design-md', 'index.md'))) {
        errors.push('Rendered skill with visual output is missing references/design-md/index.md.');
      }
    }
    if (spec?.visual_storytelling?.enabled) {
      if (!fs.existsSync(path.join(skillDir, 'references', 'visual-storytelling.md'))) {
        errors.push('Rendered skill is missing references/visual-storytelling.md.');
      }
    }
    for (const target of getTargetPlatforms(spec)) {
      switch (target.platform) {
        case 'codex':
          validateCodex(skillDir, errors, spec);
          break;
        case 'claude_code':
          validateClaude(skillDir, errors);
          break;
        case 'openclaw':
          validateOpenClaw(skillDir, errors, spec);
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
