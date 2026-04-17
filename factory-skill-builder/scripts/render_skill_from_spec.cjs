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
  const slug = getSkillSlug(spec);
  const targets = ensureArray(spec?.skill_identity?.target_platforms).filter(
    (item) => item && item.platform,
  );
  const duplicates = getDuplicatePlatforms(spec);
  if (!slug) {
    throw new Error('Spec is missing a renderable skill identity.');
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
}

function buildRenderedSpec(spec, selectedPlatforms) {
  return {
    ...spec,
    skill_identity: {
      ...(spec.skill_identity || {}),
      target_platforms: selectedPlatforms,
    },
  };
}

function buildSkillBody(spec, selectedPlatforms) {
  const scope = spec.scope || {};
  const inputs = ensureArray(spec.inputs)
    .map((input) => `- \`${input.name}\`: ${input.description}`)
    .join('\n');
  const outputs = ensureArray(spec.outputs)
    .map((output) => `- \`${output.name}\` (${output.format}): ${output.description}`)
    .join('\n');
  const dependencies = ensureArray(spec.dependencies)
    .map((dependency) => `- \`${dependency.name}\` (${dependency.kind}): ${dependency.note}`)
    .join('\n');

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

function writeCommonFiles(spec, skillDir, selectedPlatforms) {
  const slug = getSkillSlug(spec);
  const displayName = getDisplayName(spec);
  const frontmatter = {
    name: slug,
    description: getDescription(spec),
    version: spec?.skill_identity?.version || '0.1.0',
    author: spec?.skill_identity?.owner || 'unknown',
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
    ].join('\n'),
  );

  writeYamlFile(path.join(skillDir, 'spec.yaml'), spec);
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
