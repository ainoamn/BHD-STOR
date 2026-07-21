/**
 * @fileoverview Security Scanner Service
 * @description Detects common web vulnerabilities in HTTP requests.
 * Provides real-time scanning for SQL injection, path traversal,
 * command injection, and other attack patterns.
 *
 * OWASP: A03:2021 – Injection prevention.
 * Provides defense in depth alongside parameterized queries.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Severity of detected vulnerability */
export enum VulnSeverity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/** Detected vulnerability result */
export interface VulnerabilityResult {
  detected: boolean;
  type: string;
  severity: VulnSeverity;
  description: string;
  matchedPattern?: string;
  field?: string;
  recommendation: string;
}

/** Complete scan result for a request */
export interface SecurityScanResult {
  clean: boolean;
  vulnerabilities: VulnerabilityResult[];
  highestSeverity: VulnSeverity;
  riskScore: number;
}

/**
 * SQL Injection Detection Patterns
 * Comprehensive patterns covering various SQL injection techniques.
 */
const SQL_INJECTION_PATTERNS: Array<{ pattern: RegExp; name: string; severity: VulnSeverity }> = [
  // Union-based SQLi
  { pattern: /union\s+select\s+/i, name: 'union_select', severity: VulnSeverity.CRITICAL },
  { pattern: /union\s+all\s+select\s+/i, name: 'union_all_select', severity: VulnSeverity.CRITICAL },
  { pattern: /union\s+distinct\s+select\s+/i, name: 'union_distinct_select', severity: VulnSeverity.CRITICAL },

  // Error-based SQLi
  { pattern: /'\s*or\s*'1'\s*=\s*'1/i, name: 'boolean_or_1=1', severity: VulnSeverity.CRITICAL },
  { pattern: /"\s*or\s*"1"\s*=\s*"1/i, name: 'boolean_or_1=1_dquote', severity: VulnSeverity.CRITICAL },
  { pattern: /\d+\s*=\s*\d+/i, name: 'numeric_equality', severity: VulnSeverity.MEDIUM },
  { pattern: /'\s*or\s*1\s*=\s*1\s*--/i, name: 'or_1=1_comment', severity: VulnSeverity.CRITICAL },

  // Time-based blind SQLi
  { pattern: /waitfor\s+delay\s+'\d+'/i, name: 'mssql_waitfor', severity: VulnSeverity.CRITICAL },
  { pattern: /;\s*shutdown\s*/i, name: 'mssql_shutdown', severity: VulnSeverity.CRITICAL },
  { pattern: /benchmark\s*\(\s*\d+\s*,\s*/i, name: 'mysql_benchmark', severity: VulnSeverity.CRITICAL },
  { pattern: /pg_sleep\s*\(\s*\d+\s*\)/i, name: 'postgres_sleep', severity: VulnSeverity.CRITICAL },
  { pattern: /sleep\s*\(\s*\d+\s*\)/i, name: 'mysql_sleep', severity: VulnSeverity.CRITICAL },

  // Stacked queries
  { pattern: /;\s*(select|insert|update|delete|drop|create|alter|exec|execute)\s+/i, name: 'stacked_query', severity: VulnSeverity.CRITICAL },

  // Comment-based SQLi
  { pattern: /\/\*!?\*\//, name: 'block_comment', severity: VulnSeverity.MEDIUM },
  { pattern: /--\s/, name: 'line_comment', severity: VulnSeverity.MEDIUM },
  { pattern: /#\s/, name: 'hash_comment', severity: VulnSeverity.MEDIUM },

  // Boolean-based blind SQLi
  { pattern: /and\s+\d+\s*=\s*\d+/i, name: 'boolean_and', severity: VulnSeverity.HIGH },
  { pattern: /or\s+\d+\s*=\s*\d+/i, name: 'boolean_or', severity: VulnSeverity.HIGH },

  // Out-of-band SQLi
  { pattern: /load_file\s*\(/i, name: 'mysql_loadfile', severity: VulnSeverity.CRITICAL },
  { pattern: /into\s+outfile\s+/i, name: 'mysql_outfile', severity: VulnSeverity.CRITICAL },
  { pattern: /bcp\s+/i, name: 'mssql_bcp', severity: VulnSeverity.CRITICAL },

  // Database-specific functions
  { pattern: /@@version/i, name: 'mssql_version', severity: VulnSeverity.HIGH },
  { pattern: /version\s*\(\s*\)/i, name: 'sql_version_func', severity: VulnSeverity.HIGH },
  { pattern: /database\s*\(\s*\)/i, name: 'sql_database_func', severity: VulnSeverity.HIGH },
  { pattern: /user\s*\(\s*\)/i, name: 'sql_user_func', severity: VulnSeverity.HIGH },
  { pattern: /sysdate\s*\(\s*\)/i, name: 'oracle_sysdate', severity: VulnSeverity.HIGH },

  // Administrative operations
  { pattern: /drop\s+table\s+/i, name: 'drop_table', severity: VulnSeverity.CRITICAL },
  { pattern: /drop\s+database\s+/i, name: 'drop_database', severity: VulnSeverity.CRITICAL },
  { pattern: /truncate\s+table\s+/i, name: 'truncate_table', severity: VulnSeverity.CRITICAL },
  { pattern: /delete\s+from\s+/i, name: 'delete_from', severity: VulnSeverity.CRITICAL },
  { pattern: /alter\s+table\s+/i, name: 'alter_table', severity: VulnSeverity.CRITICAL },

  // Hex encoding bypass
  { pattern: /0x[0-9a-f]+/i, name: 'hex_encoded', severity: VulnSeverity.MEDIUM },

  // Char() function bypass
  { pattern: /char\s*\(\s*\d+\s*[,\)]/i, name: 'char_function', severity: VulnSeverity.MEDIUM },

  // Information schema queries
  { pattern: /information_schema\./i, name: 'information_schema', severity: VulnSeverity.HIGH },
  { pattern: /sys\./i, name: 'sys_objects', severity: VulnSeverity.HIGH },
  { pattern: /sysobjects/i, name: 'sysobjects', severity: VulnSeverity.HIGH },
];

/**
 * Path Traversal Detection Patterns
 */
const PATH_TRAVERSAL_PATTERNS: Array<{ pattern: RegExp; name: string; severity: VulnSeverity }> = [
  { pattern: /\.\.[/\\]/, name: 'dot_dot_slash', severity: VulnSeverity.CRITICAL },
  { pattern: /[/\\]\.\.[/\\]/, name: 'slash_dot_dot_slash', severity: VulnSeverity.CRITICAL },
  { pattern: /\.\.\.\.\//, name: 'multi_dot_slash', severity: VulnSeverity.CRITICAL },
  { pattern: /%2e%2e[/\\]/i, name: 'url_encoded_dot_dot', severity: VulnSeverity.CRITICAL },
  { pattern: /%2e%2e%2f/i, name: 'url_encoded_traversal', severity: VulnSeverity.CRITICAL },
  { pattern: /\.\.\\/i, name: 'windows_dot_dot_backslash', severity: VulnSeverity.CRITICAL },
  { pattern: /\\\.\.\\/, name: 'double_backslash_dot_dot', severity: VulnSeverity.CRITICAL },
  { pattern: /etc\/passwd/i, name: 'unix_passwd', severity: VulnSeverity.CRITICAL },
  { pattern: /etc\/shadow/i, name: 'unix_shadow', severity: VulnSeverity.CRITICAL },
  { pattern: /win\.ini/i, name: 'windows_ini', severity: VulnSeverity.CRITICAL },
  { pattern: /system32\/config/i, name: 'windows_config', severity: VulnSeverity.CRITICAL },
  { pattern: /\.\.(%00|\x00)/, name: 'null_byte_traversal', severity: VulnSeverity.CRITICAL },
  { pattern: /%c0%ae/i, name: 'utf8_overlong_encoding', severity: VulnSeverity.HIGH },
  { pattern: /%252e/i, name: 'double_url_encoded_dot', severity: VulnSeverity.HIGH },
  { pattern: /\.\.\\u0000/, name: 'unicode_null_traversal', severity: VulnSeverity.CRITICAL },
  { pattern: /boot\.ini/i, name: 'boot_ini', severity: VulnSeverity.CRITICAL },
  { pattern: /proc\/self\/environ/i, name: 'linux_proc_environ', severity: VulnSeverity.CRITICAL },
  { pattern: /proc\/version/i, name: 'linux_proc_version', severity: VulnSeverity.HIGH },
];

/**
 * Command Injection Detection Patterns
 */
const COMMAND_INJECTION_PATTERNS: Array<{ pattern: RegExp; name: string; severity: VulnSeverity }> = [
  { pattern: /[;&|`]\s*\w+\s/, name: 'command_separator', severity: VulnSeverity.CRITICAL },
  { pattern: /`\s*\w+\s*`/, name: 'backtick_command', severity: VulnSeverity.CRITICAL },
  { pattern: /\$\(\s*\w+\s*\)/, name: 'command_substitution', severity: VulnSeverity.CRITICAL },
  { pattern: /\|\s*\w+\s/, name: 'pipe_command', severity: VulnSeverity.CRITICAL },
  { pattern: /&&\s*\w+\s/, name: 'and_command', severity: VulnSeverity.CRITICAL },
  { pattern: /\|\|\s*\w+\s/, name: 'or_command', severity: VulnSeverity.CRITICAL },
  { pattern: /;\s*\w+\s/, name: 'semicolon_command', severity: VulnSeverity.CRITICAL },
  { pattern: /\$\{IFS\}/, name: 'ifs_substitution', severity: VulnSeverity.CRITICAL },
  { pattern: /\/bin\/\w+/i, name: 'bin_path', severity: VulnSeverity.CRITICAL },
  { pattern: /\/usr\/bin\/\w+/i, name: 'usr_bin_path', severity: VulnSeverity.CRITICAL },
  { pattern: /wget\s+/i, name: 'wget_command', severity: VulnSeverity.CRITICAL },
  { pattern: /curl\s+/i, name: 'curl_command', severity: VulnSeverity.CRITICAL },
  { pattern: /nc\s+-[e,l]/i, name: 'netcat_reverse_shell', severity: VulnSeverity.CRITICAL },
  { pattern: /bash\s+-[i,c]/i, name: 'bash_interactive', severity: VulnSeverity.CRITICAL },
  { pattern: /python\s+-[c,m]/i, name: 'python_command', severity: VulnSeverity.CRITICAL },
  { pattern: /perl\s+-[e]/i, name: 'perl_command', severity: VulnSeverity.CRITICAL },
  { pattern: /ruby\s+-[e]/i, name: 'ruby_command', severity: VulnSeverity.CRITICAL },
  { pattern: /\b(sh|bash|cmd|powershell|pwsh)\b/i, name: 'shell_invocation', severity: VulnSeverity.CRITICAL },
  { pattern: /exec\s*\(/i, name: 'exec_function', severity: VulnSeverity.CRITICAL },
  { pattern: /system\s*\(/i, name: 'system_function', severity: VulnSeverity.CRITICAL },
  { pattern: /popen\s*\(/i, name: 'popen_function', severity: VulnSeverity.CRITICAL },
  { pattern: /eval\s*\(/i, name: 'eval_function', severity: VulnSeverity.CRITICAL },
  { pattern: /spawn\s*\(/i, name: 'spawn_function', severity: VulnSeverity.CRITICAL },
  { pattern: /child_process/i, name: 'node_child_process', severity: VulnSeverity.CRITICAL },
  { pattern: /subprocess\./i, name: 'python_subprocess', severity: VulnSeverity.CRITICAL },
  { pattern: /os\.system/i, name: 'python_os_system', severity: VulnSeverity.CRITICAL },
  { pattern: /Process\.Start/i, name: 'dotnet_process_start', severity: VulnSeverity.CRITICAL },
  { pattern: /Runtime\.getRuntime\(\)\.exec/i, name: 'java_runtime_exec', severity: VulnSeverity.CRITICAL },
];

/**
 * NoSQL Injection Patterns
 */
const NOSQL_INJECTION_PATTERNS: Array<{ pattern: RegExp; name: string; severity: VulnSeverity }> = [
  { pattern: /\$eq\s*:/, name: 'mongodb_eq', severity: VulnSeverity.HIGH },
  { pattern: /\$ne\s*:/, name: 'mongodb_ne', severity: VulnSeverity.HIGH },
  { pattern: /\$gt\s*:/, name: 'mongodb_gt', severity: VulnSeverity.HIGH },
  { pattern: /\$regex\s*:/, name: 'mongodb_regex', severity: VulnSeverity.HIGH },
  { pattern: /\$where\s*:/, name: 'mongodb_where', severity: VulnSeverity.CRITICAL },
  { pattern: /\$expr\s*:/, name: 'mongodb_expr', severity: VulnSeverity.CRITICAL },
  { pattern: /\$lookup\s*:/, name: 'mongodb_lookup', severity: VulnSeverity.MEDIUM },
];

/**
 * LDAP Injection Patterns
 */
const LDAP_INJECTION_PATTERNS: Array<{ pattern: RegExp; name: string; severity: VulnSeverity }> = [
  { pattern: /\*\)/, name: 'ldap_wildcard', severity: VulnSeverity.CRITICAL },
  { pattern: /\)\s*\(\s*\|/, name: 'ldap_or_injection', severity: VulnSeverity.CRITICAL },
  { pattern: /\)\(cn=\*/i, name: 'ldap_cn_injection', severity: VulnSeverity.CRITICAL },
];

/**
 * XML/XXE Injection Patterns
 */
const XML_INJECTION_PATTERNS: Array<{ pattern: RegExp; name: string; severity: VulnSeverity }> = [
  { pattern: /<!ENTITY\s+\w+\s+SYSTEM\s+"/i, name: 'xxe_system_entity', severity: VulnSeverity.CRITICAL },
  { pattern: /<!DOCTYPE\s+\w+\s+\[/i, name: 'xxe_doctype', severity: VulnSeverity.CRITICAL },
  { pattern: /file:\/\//i, name: 'file_protocol', severity: VulnSeverity.HIGH },
  { pattern: /php:\/\/filter/i, name: 'php_filter_wrapper', severity: VulnSeverity.CRITICAL },
  { pattern: /expect:\/\//i, name: 'expect_wrapper', severity: VulnSeverity.CRITICAL },
];

@Injectable()
export class SecurityScannerService {
  private readonly logger = new Logger(SecurityScannerService.name);
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<boolean>('SECURITY_SCANNER_ENABLED', true);
  }

  /**
   * Scan a request for all types of vulnerabilities.
   *
   * @param value - The value to scan (query param, body field, header)
   * @param fieldName - Name of the field being scanned
   * @returns Complete scan result
   */
  scan(value: string, fieldName = 'unknown'): SecurityScanResult {
    if (!this.enabled) {
      return { clean: true, vulnerabilities: [], highestSeverity: VulnSeverity.INFO, riskScore: 0 };
    }

    if (!value || typeof value !== 'string') {
      return { clean: true, vulnerabilities: [], highestSeverity: VulnSeverity.INFO, riskScore: 0 };
    }

    const vulnerabilities: VulnerabilityResult[] = [];

    // Run all scan modules
    vulnerabilities.push(...this.scanSqlInjection(value, fieldName));
    vulnerabilities.push(...this.scanPathTraversal(value, fieldName));
    vulnerabilities.push(...this.scanCommandInjection(value, fieldName));
    vulnerabilities.push(...this.scanNoSqlInjection(value, fieldName));
    vulnerabilities.push(...this.scanLdapInjection(value, fieldName));
    vulnerabilities.push(...this.scanXmlInjection(value, fieldName));

    // Determine overall result
    const clean = vulnerabilities.length === 0;
    const highestSeverity = clean
      ? VulnSeverity.INFO
      : vulnerabilities.reduce((highest, v) =>
          this.severityRank(v.severity) > this.severityRank(highest) ? v.severity : highest,
        VulnSeverity.INFO);

    const riskScore = this.calculateRiskScore(vulnerabilities);

    if (!clean) {
      this.logger.warn(
        `Security scan detected ${vulnerabilities.length} vulnerabilities ` +
          `in field '${fieldName}': ${vulnerabilities.map((v) => v.type).join(', ')}`,
      );
    }

    return { clean, vulnerabilities, highestSeverity, riskScore };
  }

  /**
   * Scan all values in an object recursively.
   */
  scanObject(obj: Record<string, unknown>, path = ''): SecurityScanResult {
    const allResults: SecurityScanResult[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = path ? `${path}.${key}` : key;

      if (typeof value === 'string') {
        allResults.push(this.scan(value, fieldPath));
      } else if (typeof value === 'object' && value !== null) {
        allResults.push(this.scanObject(value as Record<string, unknown>, fieldPath));
      }
    }

    const allVulns = allResults.flatMap((r) => r.vulnerabilities);
    const clean = allVulns.length === 0;
    const highestSeverity = clean
      ? VulnSeverity.INFO
      : allVulns.reduce((highest, v) =>
          this.severityRank(v.severity) > this.severityRank(highest) ? v.severity : highest,
        VulnSeverity.INFO);

    return {
      clean,
      vulnerabilities: allVulns,
      highestSeverity,
      riskScore: this.calculateRiskScore(allVulns),
    };
  }

  // ==================== Individual Scanners ====================

  private scanSqlInjection(value: string, fieldName: string): VulnerabilityResult[] {
    return this.runPatternSet(value, SQL_INJECTION_PATTERNS, 'SQL_INJECTION', fieldName);
  }

  private scanPathTraversal(value: string, fieldName: string): VulnerabilityResult[] {
    return this.runPatternSet(value, PATH_TRAVERSAL_PATTERNS, 'PATH_TRAVERSAL', fieldName);
  }

  private scanCommandInjection(value: string, fieldName: string): VulnerabilityResult[] {
    return this.runPatternSet(value, COMMAND_INJECTION_PATTERNS, 'COMMAND_INJECTION', fieldName);
  }

  private scanNoSqlInjection(value: string, fieldName: string): VulnerabilityResult[] {
    return this.runPatternSet(value, NOSQL_INJECTION_PATTERNS, 'NOSQL_INJECTION', fieldName);
  }

  private scanLdapInjection(value: string, fieldName: string): VulnerabilityResult[] {
    return this.runPatternSet(value, LDAP_INJECTION_PATTERNS, 'LDAP_INJECTION', fieldName);
  }

  private scanXmlInjection(value: string, fieldName: string): VulnerabilityResult[] {
    return this.runPatternSet(value, XML_INJECTION_PATTERNS, 'XML_XXE_INJECTION', fieldName);
  }

  // ==================== Helpers ====================

  private runPatternSet(
    value: string,
    patterns: Array<{ pattern: RegExp; name: string; severity: VulnSeverity }>,
    type: string,
    fieldName: string,
  ): VulnerabilityResult[] {
    const results: VulnerabilityResult[] = [];

    for (const { pattern, name, severity } of patterns) {
      if (pattern.test(value)) {
        const match = value.match(pattern);
        results.push({
          detected: true,
          type,
          severity,
          description: `${type} pattern '${name}' detected in field '${fieldName}'`,
          matchedPattern: match ? match[0] : undefined,
          field: fieldName,
          recommendation: this.getRecommendation(type),
        });
      }
    }

    return results;
  }

  private getRecommendation(type: string): string {
    const recommendations: Record<string, string> = {
      SQL_INJECTION: 'Use parameterized queries/prepared statements. Never concatenate user input into SQL.',
      PATH_TRAVERSAL: 'Validate and sanitize file paths. Use allowlists for allowed directories.',
      COMMAND_INJECTION: 'Never pass user input to system commands. Use safe APIs instead.',
      NOSQL_INJECTION: 'Use parameterized queries. Validate input types before database operations.',
      LDAP_INJECTION: 'Escape special LDAP characters. Use parameterized LDAP queries.',
      XML_XXE_INJECTION: 'Disable external entity processing. Use safe XML parsers.',
    };
    return recommendations[type] || 'Validate and sanitize all user input.';
  }

  private severityRank(severity: VulnSeverity): number {
    const ranks: Record<VulnSeverity, number> = {
      [VulnSeverity.INFO]: 0,
      [VulnSeverity.LOW]: 1,
      [VulnSeverity.MEDIUM]: 2,
      [VulnSeverity.HIGH]: 3,
      [VulnSeverity.CRITICAL]: 4,
    };
    return ranks[severity];
  }

  private calculateRiskScore(vulnerabilities: VulnerabilityResult[]): number {
    let score = 0;
    for (const v of vulnerabilities) {
      score += this.severityRank(v.severity) * 25;
    }
    return Math.min(score, 100);
  }
}
