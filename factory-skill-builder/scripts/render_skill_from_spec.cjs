#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const TEMPLATE_DIR = path.resolve(
  __dirname,
  '..',
  '..',
  'utils',
  'template',
);
const DESIGN_MD_REF_DIR = path.resolve(
  __dirname,
  '..',
  '..',
  'ref',
  'design-md',
);
const PLATFORM_TEMPLATE_FILES = {
  codex: 'codex-skill-template.md',
  claude_code: 'claude-code-skill-template.md',
  openclaw: 'openclaw-skill-template.md',
  hermes_agent: 'hermes-agent-skill-template.md',
  copaw: 'copaw-skill-template.md',
  molili: 'molili-skill-template.md',
};

const {
  ensureArray,
  getDependencyNames,
  getDescription,
  getDuplicatePlatforms,
  getDisplayName,
  getSkillSlug,
  getTargetPlatformMap,
  getWhenToUse,
  isValidSkillSlug,
  isKnownPlatform,
  loadYamlFile,
  mkdirp,
  renderMarkdownList,
  toFrontmatter,
  writeYamlFile,
} = require('./_spec_common.cjs');

function parseArgs(argv) {
  const args = { force: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!args.specPath) {
      args.specPath = token;
      continue;
    }
    if (token === '--out') {
      args.outDir = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--platform') {
      args.platforms = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--force') {
      args.force = true;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }
  if (!args.specPath || !args.outDir) {
    throw new Error(
      'Usage: node render_skill_from_spec.cjs <spec.yaml> --out <output-dir> [--platform codex,claude_code] [--force]',
    );
  }
  return args;
}

function validateRenderableSpec(spec) {
  const rawSlug = String(spec?.skill_identity?.slug || '').trim();
  const slug = getSkillSlug(spec);
  const displayName = getDisplayName(spec);
  const targets = ensureArray(spec?.skill_identity?.target_platforms).filter(
    (item) => item && item.platform,
  );
  const duplicates = getDuplicatePlatforms(spec);
  if (!slug) {
    throw new Error('Spec is missing a renderable skill identity.');
  }
  if (!rawSlug) {
    throw new Error('Spec skill_identity.slug is required for rendering.');
  }
  if (!isValidSkillSlug(rawSlug)) {
    throw new Error(
      'Spec skill_identity.slug must use lowercase English letters, digits, and hyphen separators only.',
    );
  }
  if (!String(spec?.skill_identity?.display_name || '').trim()) {
    throw new Error('Spec skill_identity.display_name is required for rendering.');
  }
  if (displayName.length > 20) {
    throw new Error('Spec skill_identity.display_name must not exceed 20 characters.');
  }
  if (targets.length === 0) {
    throw new Error('Spec must include at least one target platform.');
  }
  for (const target of targets) {
    if (!isKnownPlatform(target.platform)) {
      throw new Error(`Spec declares unknown platform "${target.platform}".`);
    }
  }
  if (duplicates.length > 0) {
    throw new Error(`Spec declares duplicate target platforms: ${duplicates.join(', ')}`);
  }
  if (!String(spec?.intent?.goal || '').trim()) {
    throw new Error('Spec intent.goal is required for rendering.');
  }
  if (!String(spec?.primary_domain || '').trim()) {
    throw new Error('Spec primary_domain is required for rendering.');
  }
  if (!String(spec?.research_evidence?.coverage_status?.status || '').trim()) {
    throw new Error('Spec research_evidence.coverage_status.status is required for rendering.');
  }
  if (!Array.isArray(spec?.peer_domains)) {
    throw new Error('Spec peer_domains must be an array for rendering.');
  }
  if (!Array.isArray(spec?.research_evidence?.open_gaps)) {
    throw new Error('Spec research_evidence.open_gaps must be an array for rendering.');
  }
  validateOutputProfile(spec);
  validateResearchGate(spec);
  const designMd = spec?.design_md;
  if (designMd?.enabled) {
    if (!String(designMd.source_mode || '').trim()) {
      throw new Error('Spec design_md.source_mode is required when design_md.enabled is true.');
    }
    if (designMd.source_mode === 'preset' && !String(designMd.preset_id || '').trim()) {
      throw new Error('Spec design_md.preset_id is required when design_md.source_mode is preset.');
    }
    if (
      designMd.source_mode === 'user_provided' &&
      !String(designMd.user_provided_ref || '').trim()
    ) {
      throw new Error(
        'Spec design_md.user_provided_ref is required when design_md.source_mode is user_provided.',
      );
    }
    if (!Array.isArray(designMd.applies_to)) {
      throw new Error('Spec design_md.applies_to must be an array when design_md.enabled is true.');
    }
  }
  const visualStorytelling = spec?.visual_storytelling;
  if (visualStorytelling?.enabled) {
    if (!String(visualStorytelling.artifact_family || '').trim()) {
      throw new Error(
        'Spec visual_storytelling.artifact_family is required when visual_storytelling.enabled is true.',
      );
    }
    if (!Array.isArray(visualStorytelling.story_units) || visualStorytelling.story_units.length === 0) {
      throw new Error(
        'Spec visual_storytelling.story_units must be a non-empty array when visual_storytelling.enabled is true.',
      );
    }
    if (
      !Array.isArray(visualStorytelling.output_adapters) ||
      visualStorytelling.output_adapters.length === 0
    ) {
      throw new Error(
        'Spec visual_storytelling.output_adapters must be a non-empty array when visual_storytelling.enabled is true.',
      );
    }
    if (
      !Array.isArray(visualStorytelling?.text_hierarchy?.required_layers) ||
      visualStorytelling.text_hierarchy.required_layers.length === 0
    ) {
      throw new Error(
        'Spec visual_storytelling.text_hierarchy.required_layers must be a non-empty array when visual_storytelling.enabled is true.',
      );
    }
    if (
      visualStorytelling?.infographic_elements?.required &&
      (!Array.isArray(visualStorytelling.infographic_elements.allowed_types) ||
        visualStorytelling.infographic_elements.allowed_types.length === 0)
    ) {
      throw new Error(
        'Spec visual_storytelling.infographic_elements.allowed_types must be non-empty when infographic elements are required.',
      );
    }
  }
}

function validateOutputProfile(spec) {
  const outputProfile = spec?.output_profile || {};
  if (typeof outputProfile.has_visual_output !== 'boolean') {
    throw new Error('Spec output_profile.has_visual_output must be boolean for rendering.');
  }
  if (!Array.isArray(outputProfile.visual_output_types)) {
    throw new Error('Spec output_profile.visual_output_types must be an array for rendering.');
  }
  if (outputProfile.has_visual_output && !spec?.design_md?.enabled) {
    throw new Error(
      'Spec with output_profile.has_visual_output=true must also enable design_md before rendering.',
    );
  }
}

function validateResearchGate(spec) {
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

  if (!skillIdentityGate) {
    throw new Error('Spec research_gate.skill_identity is required for rendering.');
  }
  if (!allowedGateStatuses.has(String(skillIdentityGate.status || '').trim())) {
    throw new Error('Spec research_gate.skill_identity.status must be blocked, caution, or ready.');
  }
  if (String(skillIdentityGate.status || '').trim() !== 'ready') {
    throw new Error('Spec research_gate.skill_identity.status must be ready before rendering.');
  }
  if (skillIdentityGate.cocoloop_checked !== true) {
    throw new Error('Spec research_gate.skill_identity.cocoloop_checked must be true before rendering.');
  }
  if (skillIdentityGate.clawhub_checked !== true) {
    throw new Error('Spec research_gate.skill_identity.clawhub_checked must be true before rendering.');
  }
  if (skillIdentityGate.slug_available !== true) {
    throw new Error('Spec research_gate.skill_identity.slug_available must be true before rendering.');
  }

  if (!targetEnvironmentGate) {
    throw new Error('Spec research_gate.target_environment is required for rendering.');
  }
  if (!allowedGateStatuses.has(String(targetEnvironmentGate.status || '').trim())) {
    throw new Error('Spec research_gate.target_environment.status must be blocked, caution, or ready.');
  }
  if (String(targetEnvironmentGate.status || '').trim() !== 'ready') {
    throw new Error('Spec research_gate.target_environment.status must be ready before rendering.');
  }
  if (!String(targetEnvironmentGate.current_environment || '').trim()) {
    throw new Error('Spec research_gate.target_environment.current_environment is required for rendering.');
  }
  if (!String(targetEnvironmentGate.target_environment || '').trim()) {
    throw new Error('Spec research_gate.target_environment.target_environment is required for rendering.');
  }
  if (typeof targetEnvironmentGate.current_environment_is_target !== 'boolean') {
    throw new Error('Spec research_gate.target_environment.current_environment_is_target must be boolean.');
  }

  if (!implementationApproachGate) {
    throw new Error('Spec research_gate.implementation_approach is required for rendering.');
  }
  if (!allowedGateStatuses.has(String(implementationApproachGate.status || '').trim())) {
    throw new Error('Spec research_gate.implementation_approach.status must be blocked, caution, or ready.');
  }
  if (String(implementationApproachGate.status || '').trim() !== 'ready') {
    throw new Error('Spec research_gate.implementation_approach.status must be ready before rendering.');
  }
  if (!allowedExecutionPlanes.has(String(implementationApproachGate.selected_execution_plane || '').trim())) {
    throw new Error(
      'Spec research_gate.implementation_approach.selected_execution_plane must be one of Skill-only, Skill + CLI, Skill + API/MCP, or Skill + CLI + API/MCP.',
    );
  }
}

function buildRenderedSpec(spec, selectedPlatforms) {
  const researchContract = getResearchInteractionContract(spec);
  return {
    ...spec,
    interaction_contract: {
      ...(spec.interaction_contract || {}),
      research: researchContract,
    },
    skill_identity: {
      ...(spec.skill_identity || {}),
      target_platforms: selectedPlatforms,
    },
  };
}

function buildSkillBody(spec, selectedPlatforms) {
  const scope = spec.scope || {};
  const outputProfile = spec.output_profile || {};
  const researchInteraction = getResearchInteractionContract(spec);
  const skillIdentityGate = spec?.research_gate?.skill_identity || {};
  const targetEnvironmentGate = spec?.research_gate?.target_environment || {};
  const implementationApproachGate = spec?.research_gate?.implementation_approach || {};
  const maxQuestions = researchInteraction.max_questions;
  const countConfirmationQuestions = researchInteraction.count_confirmation_questions;
  const detectCurrentEnvironmentFirst = researchInteraction.detect_current_environment_first;
  const confirmTargetEnvironmentBeforeWriting =
    researchInteraction.confirm_target_environment_before_writing;
  const overflowStrategy = researchInteraction.overflow_strategy;
  const inputs = ensureArray(spec.inputs)
    .map((input) => `- \`${input.name}\`: ${input.description}`)
    .join('\n');
  const outputs = ensureArray(spec.outputs)
    .map((output) => `- \`${output.name}\` (${output.format}): ${output.description}`)
    .join('\n');
  const dependencies = ensureArray(spec.dependencies)
    .map((dependency) => `- \`${dependency.name}\` (${dependency.kind}): ${dependency.note}`)
    .join('\n');
  const designMd = spec?.design_md;
  const visualStorytelling = spec?.visual_storytelling;
  const designSection = designMd?.enabled
    ? [
        '## Design Input',
        '',
        '- For webpage, infographic, PPT, and other visual output tasks, read `references/design.md` before high-fidelity design.',
        '- Users can keep the default official preset, switch to another preset in `references/design-md/`, or replace it with their own `DESIGN.md`.',
        `- Current source mode: \`${designMd.source_mode}\``,
        designMd.preset_id ? `- Current preset: \`${designMd.preset_id}\`` : null,
        '',
      ].filter(Boolean)
    : [];
  const visualStorytellingSection = visualStorytelling?.enabled
    ? [
        '## Visual Storytelling',
        '',
        `- Artifact family: \`${visualStorytelling.artifact_family}\``,
        `- Output adapters: ${ensureArray(visualStorytelling.output_adapters)
          .map((item) => `\`${item}\``)
          .join(', ') || 'None declared'}`,
        `- Story units: ${ensureArray(visualStorytelling.story_units)
          .map((item) => `\`${item}\``)
          .join(', ') || 'None declared'}`,
        `- Text hierarchy: ${ensureArray(visualStorytelling?.text_hierarchy?.required_layers)
          .map((item) => `\`${item}\``)
          .join(', ') || 'None declared'}`,
        `- Infographic required: ${visualStorytelling?.infographic_elements?.required ? 'yes' : 'no'}`,
        '',
      ]
    : [];

  return [
    `# ${getDisplayName(spec)}`,
    '',
    '## Overview',
    '',
    String(spec.intent.goal || '').trim(),
    '',
    '## Use Cases',
    '',
    renderMarkdownList(spec.intent.use_scenarios),
    '',
    '## Inputs',
    '',
    inputs || '- No explicit inputs declared',
    '',
    '## Outputs',
    '',
    outputs || '- No explicit outputs declared',
    '',
    '## Research Gates',
    '',
    `- Skill identity status: \`${skillIdentityGate.status || 'unspecified'}\``,
    `- Cocoloop slug check complete: ${skillIdentityGate.cocoloop_checked === true ? 'yes' : 'no'}`,
    `- ClawHub slug check complete: ${skillIdentityGate.clawhub_checked === true ? 'yes' : 'no'}`,
    `- Slug available: ${skillIdentityGate.slug_available === true ? 'yes' : 'no'}`,
    `- Target environment status: \`${targetEnvironmentGate.status || 'unspecified'}\``,
    `- Current environment: ${targetEnvironmentGate.current_environment || 'Unspecified'}`,
    `- Target environment: ${targetEnvironmentGate.target_environment || 'Unspecified'}`,
    `- Current environment is target: ${
      typeof targetEnvironmentGate.current_environment_is_target === 'boolean'
        ? targetEnvironmentGate.current_environment_is_target
          ? 'yes'
          : 'no'
        : 'unspecified'
    }`,
    `- Implementation approach status: \`${implementationApproachGate.status || 'unspecified'}\``,
    `- Selected execution plane: \`${implementationApproachGate.selected_execution_plane || 'unspecified'}\``,
    '',
    '## Output Profile',
    '',
    `- Has visual output: ${outputProfile.has_visual_output ? 'yes' : 'no'}`,
    `- Visual output types: ${ensureArray(outputProfile.visual_output_types)
      .map((item) => `\`${item}\``)
      .join(', ') || 'None declared'}`,
    '',
    '## Interaction Rules',
    '',
    '- Plan the question budget before asking anything.',
    `- The full interaction should normally stay within ${maxQuestions} total questions${countConfirmationQuestions ? ', including confirmation questions.' : '.'}`,
    '- Ask only one key question per turn and use defaults, existing context, environment detection, or confirmations to reduce follow-up questions.',
    detectCurrentEnvironmentFirst
      ? '- Detect the current environment early and use that result to narrow the platform and runtime discussion.'
      : null,
    confirmTargetEnvironmentBeforeWriting
      ? '- Confirm the target runtime environment before writing any skill content, scaffold, implementation path, or build instructions.'
      : null,
    confirmTargetEnvironmentBeforeWriting
      ? '- If the current environment might be the target environment, ask the user to confirm that explicitly after environment detection.'
      : null,
    confirmTargetEnvironmentBeforeWriting
      ? '- If the target environment is still unclear, stop at clarification and do not start drafting the skill body or execution steps.'
      : null,
    '- If the task is already clear, skip redundant questions and move to execution or summary.',
    `- If open gaps remain near the question limit, apply \`${overflowStrategy}\` instead of extending the interview.`,
    '',
    ...designSection,
    ...visualStorytellingSection,
    '## Must Have',
    '',
    renderMarkdownList(scope.must_have) || '- None declared',
    '',
    '## Excluded',
    '',
    renderMarkdownList(scope.excluded) || '- None declared',
    '',
    '## Target Platforms',
    '',
    selectedPlatforms
      .map(
        (platform) =>
          `- \`${platform.platform}\` (${platform.support_level}): ${platform.note || 'No note'}`,
      )
      .join('\n'),
    '',
    '## Dependencies',
    '',
    dependencies || '- No dependencies declared',
    '',
    '## Fallback Policy',
    '',
    `- Allowed: ${spec?.fallback_policy?.allowed ? 'yes' : 'no'}`,
    `- Summary: ${spec?.fallback_policy?.summary || 'None declared'}`,
    '',
  ].join('\n');
}

function buildVisualStorytellingSummary(spec) {
  const visualStorytelling = spec.visual_storytelling || {};
  return [
    '# Visual Storytelling Summary',
    '',
    `- artifact_family: \`${visualStorytelling.artifact_family || ''}\``,
    `- output_adapters: ${ensureArray(visualStorytelling.output_adapters)
      .map((item) => `\`${item}\``)
      .join(', ') || 'None declared'}`,
    `- story_units: ${ensureArray(visualStorytelling.story_units)
      .map((item) => `\`${item}\``)
      .join(', ') || 'None declared'}`,
    `- text_hierarchy: ${ensureArray(visualStorytelling?.text_hierarchy?.required_layers)
      .map((item) => `\`${item}\``)
      .join(', ') || 'None declared'}`,
    `- infographic_required: ${visualStorytelling?.infographic_elements?.required ? 'yes' : 'no'}`,
    `- infographic_types: ${ensureArray(visualStorytelling?.infographic_elements?.allowed_types)
      .map((item) => `\`${item}\``)
      .join(', ') || 'None declared'}`,
    '',
  ].join('\n');
}

function getResearchInteractionContract(spec) {
  const researchContract = spec?.interaction_contract?.research || {};
  return {
    ask_one_question_per_turn:
      researchContract.ask_one_question_per_turn !== false,
    max_questions:
      Number.isFinite(researchContract.max_questions) &&
      researchContract.max_questions > 0
        ? researchContract.max_questions
        : 10,
    count_confirmation_questions:
      researchContract.count_confirmation_questions !== false,
    detect_current_environment_first:
      researchContract.detect_current_environment_first !== false,
    confirm_target_environment_before_writing:
      researchContract.confirm_target_environment_before_writing !== false,
    overflow_strategy:
      String(researchContract.overflow_strategy || '').trim() ||
      'write_open_gaps_then_continue',
  };
}

function writeCommonFiles(spec, skillDir, selectedPlatforms) {
  const slug = getSkillSlug(spec);
  const displayName = getDisplayName(spec);
  const outputProfile = spec.output_profile || {};
  const researchInteraction = getResearchInteractionContract(spec);
  const skillIdentityGate = spec?.research_gate?.skill_identity || {};
  const targetEnvironmentGate = spec?.research_gate?.target_environment || {};
  const implementationApproachGate = spec?.research_gate?.implementation_approach || {};
  const maxQuestions = researchInteraction.max_questions;
  const countConfirmationQuestions = researchInteraction.count_confirmation_questions;
  const detectCurrentEnvironmentFirst = researchInteraction.detect_current_environment_first;
  const confirmTargetEnvironmentBeforeWriting =
    researchInteraction.confirm_target_environment_before_writing;
  const overflowStrategy = researchInteraction.overflow_strategy;
  const frontmatter = {
    name: slug,
    description: getDescription(spec),
    version: spec?.skill_identity?.version || '0.1.0',
    author: spec?.skill_identity?.owner || 'unknown',
    generated_by_cocoloop: true,
  };

  if (selectedPlatforms.some((platform) => platform.platform === 'claude_code')) {
    frontmatter.when_to_use = getWhenToUse(spec);
    const allowedTools = getDependencyNames(spec, 'tool');
    if (allowedTools.length > 0) {
      frontmatter['allowed-tools'] = allowedTools;
    }
    frontmatter['user-invocable'] = true;
  }

  fs.writeFileSync(
    path.join(skillDir, 'SKILL.md'),
    `${toFrontmatter(frontmatter)}${buildSkillBody(spec, selectedPlatforms)}`,
  );

  mkdirp(path.join(skillDir, 'references'));
  fs.writeFileSync(
    path.join(skillDir, 'references', 'spec-summary.md'),
    [
      `# ${displayName} Spec Summary`,
      '',
      `- Skill Slug: \`${slug}\``,
      `- Display Name: ${displayName}`,
      `- Skill ID: \`${spec?.skill_identity?.id || slug}\``,
      `- Primary Domain: \`${spec.primary_domain || 'unspecified'}\``,
      `- Version: \`${spec?.skill_identity?.version || '0.1.0'}\``,
      `- Goal: ${spec?.intent?.goal || 'N/A'}`,
      '',
      '## Platforms',
      '',
      selectedPlatforms
        .map(
          (platform) =>
            `- \`${platform.platform}\`: ${platform.support_level} / ${platform.publish_mode || 'n/a'}`,
        )
        .join('\n'),
      '',
      '## Research Gates',
      '',
      `- Skill identity status: \`${skillIdentityGate.status || 'unspecified'}\``,
      `- Cocoloop slug check complete: ${skillIdentityGate.cocoloop_checked === true ? 'yes' : 'no'}`,
      `- ClawHub slug check complete: ${skillIdentityGate.clawhub_checked === true ? 'yes' : 'no'}`,
      `- Slug available: ${skillIdentityGate.slug_available === true ? 'yes' : 'no'}`,
      `- Target environment status: \`${targetEnvironmentGate.status || 'unspecified'}\``,
      `- Current environment: ${targetEnvironmentGate.current_environment || 'Unspecified'}`,
      `- Target environment: ${targetEnvironmentGate.target_environment || 'Unspecified'}`,
      `- Current environment is target: ${
        typeof targetEnvironmentGate.current_environment_is_target === 'boolean'
          ? targetEnvironmentGate.current_environment_is_target
            ? 'yes'
            : 'no'
          : 'unspecified'
      }`,
      `- Implementation approach status: \`${implementationApproachGate.status || 'unspecified'}\``,
      `- Selected execution plane: \`${implementationApproachGate.selected_execution_plane || 'unspecified'}\``,
      '',
      '## Design Input',
      '',
      spec?.design_md?.enabled
        ? `- Enabled: yes / source_mode: \`${spec.design_md.source_mode}\`${spec.design_md.preset_id ? ` / preset: \`${spec.design_md.preset_id}\`` : ''}`
        : '- Enabled: no',
      '',
      '## Output Profile',
      '',
      `- Has visual output: ${outputProfile.has_visual_output ? 'yes' : 'no'}`,
      `- Visual output types: ${ensureArray(outputProfile.visual_output_types)
        .map((item) => `\`${item}\``)
        .join(', ') || 'None declared'}`,
      '',
      '## Interaction Contract',
      '',
      `- Research max questions: \`${maxQuestions}\``,
      `- Count confirmation questions: ${countConfirmationQuestions ? 'yes' : 'no'}`,
      `- Detect current environment first: ${detectCurrentEnvironmentFirst ? 'yes' : 'no'}`,
      `- Confirm target environment before writing: ${confirmTargetEnvironmentBeforeWriting ? 'yes' : 'no'}`,
      `- Overflow strategy: \`${overflowStrategy}\``,
      '',
    ].join('\n'),
  );

  writeYamlFile(path.join(skillDir, 'spec.yaml'), spec);
  if (spec?.visual_storytelling?.enabled) {
    fs.writeFileSync(
      path.join(skillDir, 'references', 'visual-storytelling.md'),
      buildVisualStorytellingSummary(spec),
    );
  }
}

function getDesignOutputPath(skillDir, designMd) {
  const relativePath = designMd?.output_path || 'references/design.md';
  return path.join(skillDir, relativePath);
}

function buildCustomDesignMd(spec) {
  const designMd = spec.design_md || {};
  return [
    '# DESIGN.md',
    '',
    '## Use This First',
    '',
    'Use this document as the default visual constraint before producing any high-fidelity page, infographic, PPT, or showcase graphic.',
    '',
    '## Applies To',
    '',
    renderMarkdownList(ensureArray(designMd.applies_to)) || '- No explicit targets declared',
    '',
    '## Style Notes',
    '',
    renderMarkdownList(ensureArray(designMd.custom_style_notes)) || '- No explicit style notes declared',
    '',
    '## Fallback Rule',
    '',
    '- If the user provides a more specific DESIGN.md, prefer that file over this default brief.',
    '',
  ].join('\n');
}

function writeDesignMdFiles(spec, skillDir, specPath) {
  const designMd = spec?.design_md;
  const hasVisualOutput = spec?.output_profile?.has_visual_output === true;
  if (!designMd?.enabled && !hasVisualOutput) {
    return;
  }
  if (!designMd?.enabled && hasVisualOutput) {
    throw new Error(
      'Spec with output_profile.has_visual_output=true must enable design_md before design assets can be rendered.',
    );
  }

  const outputPath = getDesignOutputPath(skillDir, designMd);
  mkdirp(path.dirname(outputPath));

  const targetLibraryDir = path.join(skillDir, 'references', 'design-md');
  mkdirp(targetLibraryDir);

  const libraryFiles = fs
    .readdirSync(DESIGN_MD_REF_DIR)
    .filter((fileName) => fileName.endsWith('.md'));
  for (const fileName of libraryFiles) {
    fs.copyFileSync(
      path.join(DESIGN_MD_REF_DIR, fileName),
      path.join(targetLibraryDir, fileName),
    );
  }

  if (designMd.source_mode === 'preset') {
    const presetFileName = `${designMd.preset_id}.md`;
    const presetPath = path.join(DESIGN_MD_REF_DIR, presetFileName);
    if (!fs.existsSync(presetPath)) {
      throw new Error(`Unknown design_md preset "${designMd.preset_id}".`);
    }
    fs.copyFileSync(presetPath, outputPath);
  } else if (designMd.source_mode === 'user_provided') {
    const resolvedInputPath = path.resolve(path.dirname(specPath), designMd.user_provided_ref);
    if (!fs.existsSync(resolvedInputPath)) {
      throw new Error(`design_md.user_provided_ref not found: ${resolvedInputPath}`);
    }
    fs.copyFileSync(resolvedInputPath, outputPath);
  } else if (designMd.source_mode === 'custom_brief') {
    fs.writeFileSync(outputPath, buildCustomDesignMd(spec));
  } else {
    throw new Error(`Unsupported design_md.source_mode "${designMd.source_mode}".`);
  }

  fs.writeFileSync(
    path.join(skillDir, 'references', 'design-selection.md'),
    [
      '# Design Selection',
      '',
      `- source_mode: \`${designMd.source_mode}\``,
      designMd.preset_id ? `- preset_id: \`${designMd.preset_id}\`` : null,
      designMd.user_provided_ref
        ? `- user_provided_ref: \`${designMd.user_provided_ref}\``
        : null,
      `- design_entry: \`${path.relative(skillDir, outputPath) || 'references/design.md'}\``,
      '',
      designMd.prompt_user_to_use_first
        ? '- The generated skill should ask the user to read or replace this DESIGN.md before visual production.'
        : '- The generated skill keeps DESIGN.md as an optional reference.',
      '',
    ]
      .filter(Boolean)
      .join('\n'),
  );
}

function writeTemplateSelectionFiles(skillDir, selectedPlatforms) {
  const templateRefDir = path.join(skillDir, 'references', 'templates');
  mkdirp(templateRefDir);

  const filesToCopy = new Set(['spec-template.yaml']);
  for (const platform of selectedPlatforms) {
    const templateName = PLATFORM_TEMPLATE_FILES[platform.platform];
    if (templateName) filesToCopy.add(templateName);
  }

  for (const fileName of filesToCopy) {
    const sourcePath = path.join(TEMPLATE_DIR, fileName);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Required template file is missing: ${sourcePath}`);
    }
    fs.copyFileSync(sourcePath, path.join(templateRefDir, fileName));
  }

  fs.writeFileSync(
    path.join(skillDir, 'references', 'template-selection.md'),
    [
      '# Template Selection',
      '',
      'The generated skill copied these template references from the factory baseline:',
      '',
      ...Array.from(filesToCopy).map((fileName) => `- \`${fileName}\``),
      '',
    ].join('\n'),
  );
}

function writeCodexManifest(spec, skillDir) {
  mkdirp(path.join(skillDir, 'agents'));
  writeYamlFile(path.join(skillDir, 'agents', 'openai.yaml'), {
    interface: {
      display_name: getDisplayName(spec),
      short_description: getDescription(spec),
      default_prompt: `Use $${getSkillSlug(spec)} to help with this task.`,
    },
    policy: {
      allow_implicit_invocation: true,
    },
  });
}

function writeClaudeManifest(spec, skillDir, platformInfo) {
  mkdirp(path.join(skillDir, 'platform-manifests'));
  writeYamlFile(path.join(skillDir, 'platform-manifests', 'claude-code.yaml'), {
    install_paths: [
      `~/.claude/skills/${getSkillSlug(spec)}`,
      `./.claude/skills/${getSkillSlug(spec)}`,
    ],
    support_level: platformInfo.support_level,
    standard_source: platformInfo.standard_source || '',
    validation_mode: platformInfo.validation_mode || '',
  });
}

function writeOpenClawManifest(spec, skillDir, platformInfo) {
  mkdirp(path.join(skillDir, 'platform-manifests'));
  const version = spec?.skill_identity?.version || '0.1.0';
  writeYamlFile(path.join(skillDir, 'platform-manifests', 'openclaw-publish.yaml'), {
    slug: getSkillSlug(spec),
    name: getDisplayName(spec),
    version,
    tags: [spec.primary_domain, ...ensureArray(spec.peer_domains)].filter(Boolean),
    changelog: `Release ${version}`,
    publish_command: `clawhub skill publish ${getSkillSlug(spec)} --slug ${getSkillSlug(spec)} --version ${version} --changelog "Release ${version}"`,
    standard_source: platformInfo.standard_source || '',
  });
}

function writeHermesManifest(spec, skillDir, platformInfo) {
  mkdirp(path.join(skillDir, 'platform-manifests'));
  writeYamlFile(path.join(skillDir, 'platform-manifests', 'hermes-agent.yaml'), {
    name: getDisplayName(spec),
    version: spec?.skill_identity?.version || '0.1.0',
    author: spec?.skill_identity?.owner || 'unknown',
    required_environment_variables: getDependencyNames(spec, 'env'),
    required_credential_files: getDependencyNames(spec, 'credential'),
    publish_target: platformInfo.publish_mode || 'hub_publish',
    standard_source: platformInfo.standard_source || '',
    preflight_checks: [
      'Verify required environment variables are documented before install',
      'Verify required credential files are documented before install',
      'Run security and trust review before hub publish',
    ],
  });
}

function writeCopawManifest(spec, skillDir, platformInfo) {
  mkdirp(path.join(skillDir, 'platform-manifests'));
  writeYamlFile(path.join(skillDir, 'platform-manifests', 'copaw-authoring.yaml'), {
    support_level: platformInfo.support_level,
    required_files: ['SKILL.md'],
    optional_directories: ['scripts', 'references', 'assets'],
    standard_source: platformInfo.standard_source || '',
  });
}

function writeMoliliManifest(spec, skillDir, platformInfo) {
  mkdirp(path.join(skillDir, 'platform-manifests'));
  const adapter = spec?.adapters?.molili || {};
  writeYamlFile(path.join(skillDir, 'platform-manifests', 'molili-install.yaml'), {
    support_level: platformInfo.support_level,
    source_root: adapter.source_root || '~/.cocoloop/skills',
    active_root:
      adapter.active_root || '~/.molili/workspaces/default/active_skills',
    activation_strategy: adapter.activation_strategy || 'symlink_then_copy',
    verification_steps:
      ensureArray(adapter.verification_steps).length > 0
        ? adapter.verification_steps
        : [
            'Verify SKILL.md exists in source directory',
            'Verify activated skill path exists in active_skills',
            'Invoke the skill once and confirm Molili discovers it',
          ],
  });
}

function renderSkillFromSpec(specPath, outDir, options = {}) {
  const spec = loadYamlFile(specPath);
  validateRenderableSpec(spec);
  const platformMap = getTargetPlatformMap(spec);
  const selectedPlatforms = options.platforms?.length
    ? options.platforms.map((platform) => {
        const info = platformMap.get(platform);
        if (!info) {
          throw new Error(`Platform "${platform}" not found in spec target_platforms.`);
        }
        return info;
      })
    : Array.from(platformMap.values());
  const renderedSpec = buildRenderedSpec(spec, selectedPlatforms);

  const skillDir = path.join(path.resolve(outDir), getSkillSlug(spec));
  if (fs.existsSync(skillDir)) {
    if (!options.force) {
      throw new Error(`Output directory already exists: ${skillDir}`);
    }
    fs.rmSync(skillDir, { recursive: true, force: true });
  }

  mkdirp(skillDir);
  writeCommonFiles(renderedSpec, skillDir, selectedPlatforms);
  writeTemplateSelectionFiles(skillDir, selectedPlatforms);
  writeDesignMdFiles(renderedSpec, skillDir, specPath);

  for (const platformInfo of selectedPlatforms) {
    switch (platformInfo.platform) {
      case 'codex':
        writeCodexManifest(renderedSpec, skillDir);
        break;
      case 'claude_code':
        writeClaudeManifest(renderedSpec, skillDir, platformInfo);
        break;
      case 'openclaw':
        writeOpenClawManifest(renderedSpec, skillDir, platformInfo);
        break;
      case 'hermes_agent':
        writeHermesManifest(renderedSpec, skillDir, platformInfo);
        break;
      case 'copaw':
        writeCopawManifest(renderedSpec, skillDir, platformInfo);
        break;
      case 'molili':
        writeMoliliManifest(renderedSpec, skillDir, platformInfo);
        break;
      default:
        throw new Error(`Unsupported render platform "${platformInfo.platform}".`);
    }
  }

  return {
    skillDir,
    skillName: getSkillSlug(spec),
    renderedSpecPath: path.join(skillDir, 'spec.yaml'),
    targetPlatforms: selectedPlatforms,
    platforms: selectedPlatforms.map((item) => item.platform),
  };
}

if (require.main === module) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = renderSkillFromSpec(args.specPath, args.outDir, {
      force: args.force,
      platforms: args.platforms
        ? args.platforms.split(',').map((value) => value.trim()).filter(Boolean)
        : null,
    });
    console.log(`✅ Rendered skill at ${result.skillDir}`);
    console.log(`Platforms: ${result.platforms.join(', ')}`);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}

module.exports = { renderSkillFromSpec };
