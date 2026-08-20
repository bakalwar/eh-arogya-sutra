/**
 * F3D-2B H2: forbid runtime trees from importing cue-parser internals or
 * calling parseOwnerFrozenCues. Shared by unit probes and CI. Uses the
 * installed TypeScript compiler API (no extra dependency).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';

export const PARSER_RUNTIME_TREES = [
  'apps/api',
  'apps/worker',
  'apps/web',
  'packages/database',
  'packages/evidence-extract-adapters',
];

/**
 * Exact files only. Not a directory or suffix allowlist.
 * C1 chief-complaint adapter + C2 F3C reviewed-source adapter.
 */
export const H2_CUE_ADAPTER_ALLOWLIST_REL = [
  'packages/database/src/services/cueEligibleSourceService.ts',
  'packages/database/src/services/f3cReviewedCueSourceService.ts',
];

export function isExactCueAdapterPath(filePath) {
  const normalized = String(filePath).replaceAll('\\', '/');
  return H2_CUE_ADAPTER_ALLOWLIST_REL.includes(normalized);
}

const SKIP_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  '.extract-tools',
  '.next',
  '.git',
  'coverage',
  'clinical-artifacts',
  '.venv',
]);

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts']);

const FORBIDDEN_BINDING_RULE = {
  parseOwnerFrozenCues: 'H2_ROOT_PARSE_IMPORT',
  parseOwnerFrozenCuesInternalForTests: 'H2_PARSE_INTERNAL_FOR_TESTS',
  executeOwnerFrozenCueParse: 'H2_EXECUTE_OWNER_FROZEN_CUE_PARSE',
  scanFrozenAliases: 'H2_SCAN_FROZEN_ALIASES',
  internalForTests: 'H2_INTERNAL_FOR_TESTS',
};

const FORBIDDEN_CALL_RULE = {
  parseOwnerFrozenCues: 'H2_PARSE_OWNER_FROZEN_CUES_CALL',
  parseOwnerFrozenCuesInternalForTests: 'H2_PARSE_INTERNAL_FOR_TESTS',
  executeOwnerFrozenCueParse: 'H2_EXECUTE_OWNER_FROZEN_CUE_PARSE',
  scanFrozenAliases: 'H2_SCAN_FROZEN_ALIASES',
};

const SUSPICIOUS_UNRESOLVED =
  /parser|evidence-extract|internalForTests|FrozenCue|scanFrozen|executeOwnerFrozen/i;

export function posixRel(from, to) {
  return path.relative(from, to).split(path.sep).join('/');
}

function isInsideRoot(absPath, rootReal) {
  const rel = path.relative(rootReal, absPath);
  return rel === '' || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel));
}

function isTestPath(relPosix) {
  return (
    /(?:^|\/)(?:__)?tests(?:__)?(?:\/|$)/.test(relPosix) ||
    /(?:^|\/)__tests__\//.test(relPosix) ||
    /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(relPosix)
  );
}

function scriptKindFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.tsx') return ts.ScriptKind.TSX;
  if (ext === '.jsx') return ts.ScriptKind.JSX;
  if (ext === '.js' || ext === '.mjs' || ext === '.cjs') return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function normalizeSpec(spec) {
  return String(spec).replace(/\\/g, '/');
}

export function classifyModuleSpecifier(spec) {
  const rules = [];
  const raw = String(spec);
  const n = normalizeSpec(raw);
  const lower = n.toLowerCase();

  if (raw.includes('\\') && /terminology[/\\]parser/i.test(raw)) {
    rules.push('H2_WINDOWS_PARSER_PATH');
  }
  if (
    /dist\/terminology\/parser(?:\/|$)/i.test(lower) ||
    /\/dist\/terminology\/parser/i.test(lower)
  ) {
    rules.push('H2_DIST_PARSER_PATH');
  }
  if (/@ehas2\/evidence-extract\//i.test(n)) {
    rules.push('H2_PACKAGE_NON_ROOT');
    if (/parser/i.test(n)) rules.push('H2_PACKAGE_PARSER_SUBPATH');
  }
  if (
    /terminology\/parser\/match(?:\.[cm]?[jt]sx?)?$/i.test(lower) ||
    /\/parser\/match(?:\.[cm]?[jt]sx?)?$/i.test(lower)
  ) {
    rules.push('H2_RELATIVE_PARSER_MATCH');
  }
  if (
    /terminology\/parser\/execute(?:\.[cm]?[jt]sx?)?$/i.test(lower) ||
    /\/parser\/execute(?:\.[cm]?[jt]sx?)?$/i.test(lower)
  ) {
    rules.push('H2_RELATIVE_PARSER_EXECUTE');
  }
  if (/internalfortests/i.test(lower)) {
    rules.push('H2_INTERNAL_FOR_TESTS');
  }
  if (
    /terminology\/parser(?:\/|$)/i.test(lower) ||
    /\/src\/terminology\/parser(?:\/|$)/i.test(lower)
  ) {
    rules.push('H2_PARSER_INTERNAL_PATH');
  }
  return [...new Set(rules)];
}

function stringFromExpr(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isTemplateExpression(node) && node.templateSpans.length === 0) {
    return node.head.text;
  }
  return null;
}

function isEvidenceExtractRootSpec(spec) {
  return spec === '@ehas2/evidence-extract';
}

function unwrapExpr(node) {
  let cur = node;
  while (cur) {
    if (ts.isParenthesizedExpression(cur) || ts.isAwaitExpression(cur)) {
      cur = cur.expression;
      continue;
    }
    if (
      ts.isAsExpression(cur) ||
      ts.isTypeAssertionExpression(cur) ||
      ts.isNonNullExpression(cur)
    ) {
      cur = cur.expression;
      continue;
    }
    if (typeof ts.isSatisfiesExpression === 'function' && ts.isSatisfiesExpression(cur)) {
      cur = cur.expression;
      continue;
    }
    break;
  }
  return cur;
}

function loadCallMeta(node) {
  const inner = unwrapExpr(node);
  if (!inner || !ts.isCallExpression(inner)) return { spec: null, kind: null };
  const expr = inner.expression;
  const kind =
    expr.kind === ts.SyntaxKind.ImportKeyword
      ? 'H2_DYNAMIC_IMPORT'
      : ts.isIdentifier(expr) && expr.text === 'require'
        ? 'H2_REQUIRE'
        : null;
  if (!kind) return { spec: null, kind: null };
  return { spec: stringFromExpr(inner.arguments[0]), kind };
}

function forbiddenMemberName(node) {
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (
    ts.isElementAccessExpression(node) &&
    node.argumentExpression &&
    ts.isStringLiteral(node.argumentExpression)
  ) {
    return node.argumentExpression.text;
  }
  return null;
}

function exprIsRootNamespace(expr, namespaces) {
  if (ts.isIdentifier(expr) && namespaces.has(expr.text)) return true;
  const { spec } = loadCallMeta(expr);
  return Boolean(spec && isEvidenceExtractRootSpec(spec));
}

function pushFinding(findings, filePath, rule) {
  findings.push({ path: filePath, rule });
}

function flagForbiddenBinding(imported, local, filePath, findings, aliases, origin = 'any') {
  if (
    origin === 'esm-named-import' &&
    isExactCueAdapterPath(filePath) &&
    imported === 'parseOwnerFrozenCues' &&
    local === 'parseOwnerFrozenCues'
  ) {
    return;
  }
  const rule = FORBIDDEN_BINDING_RULE[imported];
  if (!rule) return;
  pushFinding(findings, filePath, rule);
  if (local !== imported) {
    pushFinding(findings, filePath, 'H2_ALIASED_PARSER_IMPORT');
  }
  aliases.set(local, imported);
}

function recordNamedImport(importClause, spec, filePath, findings, aliases, namespaces) {
  if (!importClause) return;
  if (importClause.namedBindings && ts.isNamespaceImport(importClause.namedBindings)) {
    namespaces.set(importClause.namedBindings.name.text, spec);
    return;
  }
  if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
    for (const el of importClause.namedBindings.elements) {
      const imported = (el.propertyName ?? el.name).text;
      flagForbiddenBinding(imported, el.name.text, filePath, findings, aliases, 'esm-named-import');
    }
  }
}

function recordObjectBindings(pattern, filePath, findings, aliases) {
  for (const el of pattern.elements) {
    if (!ts.isBindingElement(el) || el.dotDotDotToken) continue;
    if (!ts.isIdentifier(el.name)) continue;
    let imported;
    if (!el.propertyName) imported = el.name.text;
    else if (ts.isIdentifier(el.propertyName)) imported = el.propertyName.text;
    else if (ts.isStringLiteral(el.propertyName)) imported = el.propertyName.text;
    else continue;
    flagForbiddenBinding(imported, el.name.text, filePath, findings, aliases);
  }
}

function visitForbiddenAccess(node, filePath, findings, namespaces) {
  const name = forbiddenMemberName(node);
  if (!name) return;
  const target =
    ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)
      ? node.expression
      : null;
  if (!target || !exprIsRootNamespace(target, namespaces)) return;
  if (FORBIDDEN_BINDING_RULE[name] || FORBIDDEN_CALL_RULE[name]) {
    pushFinding(findings, filePath, 'H2_NAMESPACE_PARSER_ACCESS');
    if (FORBIDDEN_BINDING_RULE[name]) pushFinding(findings, filePath, FORBIDDEN_BINDING_RULE[name]);
    if (FORBIDDEN_CALL_RULE[name]) pushFinding(findings, filePath, FORBIDDEN_CALL_RULE[name]);
  }
}

function inspectNode(node, filePath, findings, aliases, namespaces) {
  if (
    ts.isImportDeclaration(node) &&
    node.moduleSpecifier &&
    ts.isStringLiteral(node.moduleSpecifier)
  ) {
    const spec = node.moduleSpecifier.text;
    for (const rule of classifyModuleSpecifier(spec)) {
      pushFinding(findings, filePath, rule);
    }
    recordNamedImport(node.importClause, spec, filePath, findings, aliases, namespaces);
  }

  if (
    ts.isExportDeclaration(node) &&
    node.moduleSpecifier &&
    ts.isStringLiteral(node.moduleSpecifier)
  ) {
    const spec = node.moduleSpecifier.text;
    for (const rule of classifyModuleSpecifier(spec)) {
      pushFinding(findings, filePath, rule);
    }
    if (
      (isEvidenceExtractRootSpec(spec) || classifyModuleSpecifier(spec).length > 0) &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause)
    ) {
      for (const el of node.exportClause.elements) {
        const imported = (el.propertyName ?? el.name).text;
        flagForbiddenBinding(imported, el.name.text, filePath, findings, aliases);
      }
    }
  }

  if (ts.isVariableDeclaration(node) && node.initializer) {
    const { spec } = loadCallMeta(node.initializer);
    if (spec && isEvidenceExtractRootSpec(spec)) {
      if (ts.isIdentifier(node.name)) {
        namespaces.set(node.name.text, spec);
      } else if (ts.isObjectBindingPattern(node.name)) {
        recordObjectBindings(node.name, filePath, findings, aliases);
      }
    }
    const init = unwrapExpr(node.initializer);
    const member = forbiddenMemberName(init);
    if (
      ts.isIdentifier(node.name) &&
      member &&
      (FORBIDDEN_BINDING_RULE[member] || FORBIDDEN_CALL_RULE[member]) &&
      (ts.isPropertyAccessExpression(init) || ts.isElementAccessExpression(init)) &&
      exprIsRootNamespace(init.expression, namespaces)
    ) {
      aliases.set(node.name.text, member);
    }
  }

  if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
    const spec = stringFromExpr(node.moduleReference.expression);
    if (spec) {
      pushFinding(findings, filePath, 'H2_REQUIRE');
      for (const rule of classifyModuleSpecifier(spec)) pushFinding(findings, filePath, rule);
    } else {
      const blob = node.moduleReference.getText();
      if (SUSPICIOUS_UNRESOLVED.test(blob)) {
        pushFinding(findings, filePath, 'H2_SCAN_DYNAMIC_UNRESOLVED');
      }
    }
  }

  if (ts.isImportTypeNode(node) && node.argument && ts.isLiteralTypeNode(node.argument)) {
    const lit = node.argument.literal;
    if (ts.isStringLiteral(lit)) {
      for (const rule of classifyModuleSpecifier(lit.text)) pushFinding(findings, filePath, rule);
    }
  }

  if (ts.isCallExpression(node)) {
    const expr = node.expression;
    const dynKind =
      expr.kind === ts.SyntaxKind.ImportKeyword
        ? 'H2_DYNAMIC_IMPORT'
        : ts.isIdentifier(expr) && expr.text === 'require'
          ? 'H2_REQUIRE'
          : null;
    if (dynKind) {
      const spec = stringFromExpr(node.arguments[0]);
      if (spec === null) {
        const blob = node.arguments[0] ? node.arguments[0].getText() : '';
        if (SUSPICIOUS_UNRESOLVED.test(blob)) {
          pushFinding(findings, filePath, 'H2_SCAN_DYNAMIC_UNRESOLVED');
        }
      } else {
        const specRules = classifyModuleSpecifier(spec);
        if (
          specRules.length > 0 ||
          FORBIDDEN_BINDING_RULE[spec] ||
          /parseOwnerFrozenCues/.test(spec)
        ) {
          pushFinding(findings, filePath, dynKind);
          for (const rule of specRules) pushFinding(findings, filePath, rule);
        }
      }
    }

    if (ts.isIdentifier(expr)) {
      if (FORBIDDEN_CALL_RULE[expr.text]) {
        const allowAdapterEsmCall =
          isExactCueAdapterPath(filePath) &&
          expr.text === 'parseOwnerFrozenCues' &&
          !aliases.has(expr.text);
        if (!allowAdapterEsmCall) {
          pushFinding(findings, filePath, FORBIDDEN_CALL_RULE[expr.text]);
        }
      } else if (aliases.has(expr.text)) {
        pushFinding(findings, filePath, 'H2_ALIASED_PARSER_IMPORT');
        const orig = aliases.get(expr.text);
        if (FORBIDDEN_CALL_RULE[orig]) pushFinding(findings, filePath, FORBIDDEN_CALL_RULE[orig]);
      }
    }
    if (ts.isPropertyAccessExpression(expr) || ts.isElementAccessExpression(expr)) {
      visitForbiddenAccess(expr, filePath, findings, namespaces);
    }
  }

  if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    visitForbiddenAccess(node, filePath, findings, namespaces);
  }

  ts.forEachChild(node, (child) => inspectNode(child, filePath, findings, aliases, namespaces));
}

export function inspectSource(source, virtualPath = 'probe.ts') {
  const findings = [];
  let sf;
  try {
    sf = ts.createSourceFile(
      virtualPath,
      source,
      ts.ScriptTarget.Latest,
      true,
      scriptKindFor(virtualPath),
    );
  } catch {
    return [{ path: virtualPath, rule: 'H2_SCAN_PARSE_FAILED' }];
  }
  const parseErrors = (sf.parseDiagnostics ?? []).filter(
    (d) => d.category === ts.DiagnosticCategory.Error,
  );
  if (parseErrors.length > 0) {
    return [{ path: virtualPath, rule: 'H2_SCAN_PARSE_FAILED' }];
  }
  const aliases = new Map();
  const namespaces = new Map();
  inspectNode(sf, virtualPath, findings, aliases, namespaces);
  return findings;
}

function scanFile(absFile, rootReal, findings) {
  let text;
  try {
    text = fs.readFileSync(absFile, 'utf8');
  } catch {
    findings.push({ path: posixRel(rootReal, absFile), rule: 'H2_SCAN_READ_FAILED' });
    return;
  }
  const rel = posixRel(rootReal, absFile);
  const result = inspectSource(text, rel);
  findings.push(...result);
}

export function scanDirectory(absDir, rootReal = absDir) {
  const findings = [];
  let dirReal;
  try {
    dirReal = fs.realpathSync(absDir);
    rootReal = fs.realpathSync(rootReal);
  } catch {
    return [{ path: posixRel(process.cwd(), absDir), rule: 'H2_SCAN_READ_FAILED' }];
  }

  function walk(current) {
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      findings.push({ path: posixRel(rootReal, current), rule: 'H2_SCAN_READ_FAILED' });
      return;
    }
    for (const ent of entries) {
      const abs = path.join(current, ent.name);
      let real;
      try {
        real = fs.realpathSync(abs);
      } catch {
        findings.push({ path: posixRel(rootReal, abs), rule: 'H2_SCAN_READ_FAILED' });
        continue;
      }
      if (!isInsideRoot(real, rootReal)) {
        findings.push({ path: posixRel(rootReal, abs), rule: 'H2_SYMLINK_ESCAPE' });
        continue;
      }
      const rel = posixRel(rootReal, real);
      if (ent.isSymbolicLink() || ent.isDirectory()) {
        const st = fs.statSync(real);
        if (st.isDirectory()) {
          if (SKIP_DIR_NAMES.has(ent.name)) continue;
          walk(real);
          continue;
        }
      }
      if (!ent.isFile() && !(ent.isSymbolicLink() && fs.statSync(real).isFile())) continue;
      const ext = path.extname(ent.name).toLowerCase();
      if (ent.name.endsWith('.d.ts') || !SOURCE_EXT.has(ext)) continue;
      if (isTestPath(rel)) continue;
      scanFile(real, rootReal, findings);
    }
  }

  walk(dirReal);
  return findings;
}

export function scanParserRuntimeTrees(repoRoot) {
  const findings = [];
  let rootReal;
  try {
    rootReal = fs.realpathSync(repoRoot);
  } catch {
    return [{ path: '.', rule: 'H2_SCAN_READ_FAILED' }];
  }
  for (const relTree of PARSER_RUNTIME_TREES) {
    const abs = path.join(rootReal, relTree);
    if (!fs.existsSync(abs)) continue;
    findings.push(...scanDirectory(abs, rootReal));
  }
  return findings;
}

export function formatFirewallFindings(findings) {
  return findings.map((f) => `${f.rule}\t${f.path}`).join('\n');
}

const thisFile = fileURLToPath(import.meta.url);
const invoked = process.argv[1] ? path.resolve(process.argv[1]) === thisFile : false;
if (invoked) {
  const repoRoot = path.resolve(path.dirname(thisFile), '..');
  const findings = scanParserRuntimeTrees(repoRoot);
  if (findings.length > 0) {
    console.error('H2_RUNTIME_PARSER_IMPORT_FORBIDDEN\n' + formatFirewallFindings(findings));
    process.exit(1);
  }
}
