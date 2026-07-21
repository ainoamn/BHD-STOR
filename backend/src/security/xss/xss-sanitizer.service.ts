/**
 * @fileoverview XSS Sanitizer Service
 * @description Comprehensive XSS protection service following OWASP XSS Prevention Cheat Sheet.
 * Implements multiple layers of defense: input sanitization, output encoding,
 * and context-aware validation.
 *
 * OWASP Categories Covered:
 * - Reflected XSS
 * - Stored XSS
 * - DOM-based XSS
 * - Template injection
 * - Unicode/encoding bypasses
 * - SVG-based XSS
 * - Data URI attacks
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Severity levels for XSS detection */
export enum XssSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/** Result of XSS detection */
export interface XssDetectionResult {
  isMalicious: boolean;
  severity: XssSeverity;
  detectedPatterns: string[];
  sanitizedValue: string;
  originalLength: number;
}

/**
 * XSS Pattern Database
 * Comprehensive collection of known XSS attack patterns.
 * Updated regularly to cover new attack vectors.
 */
const XSS_PATTERNS: Array<{ pattern: RegExp; name: string; severity: XssSeverity }> = [
  // --- Script tag variations ---
  { pattern: /<script[^>]*>[\s\S]*?<\/script[^>]*>/i, name: 'script_tag', severity: XssSeverity.CRITICAL },
  { pattern: /<script[^>]*\/>/i, name: 'self_closing_script', severity: XssSeverity.CRITICAL },
  { pattern: /<script[^>]*>/i, name: 'script_tag_open', severity: XssSeverity.CRITICAL },
  { pattern: /<\/script>/i, name: 'script_tag_close', severity: XssSeverity.CRITICAL },

  // --- Event handlers ---
  { pattern: /\s(on\w+)\s*=\s*["']?[^"'>]*(?:javascript:|alert|confirm|prompt|eval|expression)/i, name: 'event_handler_js', severity: XssSeverity.CRITICAL },
  { pattern: /\s(on\w+)\s*=\s*["']?[^"'>]*\(/i, name: 'event_handler_inline', severity: XssSeverity.HIGH },
  { pattern: /\son\w+\s*=/i, name: 'event_handler_generic', severity: XssSeverity.HIGH },

  // --- JavaScript pseudo-protocol ---
  { pattern: /javascript:/i, name: 'javascript_protocol', severity: XssSeverity.CRITICAL },
  { pattern: /(?:href|src|action|background|dynsrc|lowsrc)\s*=\s*["']?javascript:/i, name: 'js_protocol_attribute', severity: XssSeverity.CRITICAL },
  { pattern: /vbscript:/i, name: 'vbscript_protocol', severity: XssSeverity.CRITICAL },
  { pattern: /data:\s*text\/html/i, name: 'data_uri_html', severity: XssSeverity.CRITICAL },
  { pattern: /data:\s*image\/svg\+xml/i, name: 'data_uri_svg', severity: XssSeverity.CRITICAL },
  { pattern: /data:\s*text\/javascript/i, name: 'data_uri_js', severity: XssSeverity.CRITICAL },
  { pattern: /mhtml:/i, name: 'mhtml_protocol', severity: XssSeverity.CRITICAL },
  { pattern: /about:/i, name: 'about_protocol', severity: XssSeverity.HIGH },

  // --- Dangerous HTML tags ---
  { pattern: /<iframe[^>]*>/i, name: 'iframe_tag', severity: XssSeverity.CRITICAL },
  { pattern: /<object[^>]*>/i, name: 'object_tag', severity: XssSeverity.CRITICAL },
  { pattern: /<embed[^>]*>/i, name: 'embed_tag', severity: XssSeverity.CRITICAL },
  { pattern: /<applet[^>]*>/i, name: 'applet_tag', severity: XssSeverity.CRITICAL },
  { pattern: /<form[^>]*>/i, name: 'form_tag', severity: XssSeverity.HIGH },
  { pattern: /<input[^>]*type\s*=\s*["']?image["']?/i, name: 'input_image_type', severity: XssSeverity.HIGH },
  { pattern: /<meta[^>]*http-equiv\s*=\s*["']?refresh["']?/i, name: 'meta_refresh', severity: XssSeverity.CRITICAL },
  { pattern: /<link[^>]*>/i, name: 'link_tag', severity: XssSeverity.HIGH },
  { pattern: /<base[^>]*>/i, name: 'base_tag', severity: XssSeverity.HIGH },
  { pattern: /<style[^>]*>[\s\S]*?(expression|behavior|javascript|import)/i, name: 'style_xss', severity: XssSeverity.CRITICAL },
  { pattern: /<svg[^>]*>/i, name: 'svg_tag', severity: XssSeverity.HIGH },
  { pattern: /<svg[^>]*on\w+\s*=/i, name: 'svg_event_handler', severity: XssSeverity.CRITICAL },

  // --- Dangerous attributes ---
  { pattern: /\sformaction\s*=/i, name: 'formaction_attribute', severity: XssSeverity.CRITICAL },

  // --- Eval and dynamic execution ---
  { pattern: /eval\s*\(/i, name: 'eval_function', severity: XssSeverity.CRITICAL },
  { pattern: /Function\s*\(/i, name: 'function_constructor', severity: XssSeverity.CRITICAL },
  { pattern: /setTimeout\s*\(\s*["'][^"']*["']/i, name: 'setTimeout_string', severity: XssSeverity.HIGH },
  { pattern: /setInterval\s*\(\s*["'][^"']*["']/i, name: 'setInterval_string', severity: XssSeverity.HIGH },
  { pattern: /execScript\s*\(/i, name: 'execScript', severity: XssSeverity.CRITICAL },
  { pattern: /\(function\s*\(\s*\)\s*\{/i, name: 'iife_pattern', severity: XssSeverity.MEDIUM },

  // --- Expression/behavior (IE) ---
  { pattern: /expression\s*\(/i, name: 'css_expression', severity: XssSeverity.CRITICAL },
  { pattern: /behavior\s*:\s*url/i, name: 'css_behavior', severity: XssSeverity.CRITICAL },
  { pattern: /-moz-binding/i, name: 'moz_binding', severity: XssSeverity.CRITICAL },

  // --- Template injection ---
  { pattern: /\{\{[\s\S]*?\}\}/, name: 'template_injection_mustache', severity: XssSeverity.HIGH },
  { pattern: /\$\{[\s\S]*?\}/, name: 'template_literal_js', severity: XssSeverity.HIGH },
  { pattern: /<%[\s\S]*?%>/, name: 'template_erb', severity: XssSeverity.HIGH },
  { pattern: /\{\%[\s\S]*?\%\}/, name: 'template_jinja', severity: XssSeverity.HIGH },
  { pattern: /\{#[\s\S]*?#\}/, name: 'template_comment', severity: XssSeverity.MEDIUM },

  // --- Unicode and encoding bypasses ---
  { pattern: /&#x0*[0-9a-f]+;?/i, name: 'hex_entity_encoding', severity: XssSeverity.MEDIUM },
  { pattern: /&#0*\d+;?/, name: 'decimal_entity_encoding', severity: XssSeverity.MEDIUM },
  { pattern: /&#[^;]+;?/, name: 'numeric_entity_encoding', severity: XssSeverity.MEDIUM },
  { pattern: /%[0-9a-f]{2}/i, name: 'url_encoding', severity: XssSeverity.LOW },
  { pattern: /\\u[0-9a-f]{4}/i, name: 'unicode_escape', severity: XssSeverity.MEDIUM },
  { pattern: /\\x[0-9a-f]{2}/i, name: 'hex_escape', severity: XssSeverity.MEDIUM },

  // --- Protocol-less attacks ---
  { pattern: /\/\/[\w\-.]+\/[\w\-.]+/i, name: 'protocol_relative_url', severity: XssSeverity.MEDIUM },

  // --- HTML5 attack vectors ---
  { pattern: /<details[^>]*\sopen\s*[^>]*\s*ontoggle\s*=/i, name: 'details_ontoggle', severity: XssSeverity.CRITICAL },
  { pattern: /<video[^>]*\s*onerror\s*=/i, name: 'video_onerror', severity: XssSeverity.CRITICAL },
  { pattern: /<audio[^>]*\s*onerror\s*=/i, name: 'audio_onerror', severity: XssSeverity.CRITICAL },
  { pattern: /<marquee[^>]*\s*on\w+\s*=/i, name: 'marquee_event', severity: XssSeverity.HIGH },
  { pattern: /<body[^>]*\s*on\w+\s*=/i, name: 'body_event', severity: XssSeverity.CRITICAL },
  { pattern: /<img[^>]*\s*on\w+\s*=/i, name: 'img_event', severity: XssSeverity.CRITICAL },
  { pattern: /<input[^>]*\s*on\w+\s*=/i, name: 'input_event', severity: XssSeverity.HIGH },

  // --- Null byte / encoding tricks ---
  { pattern: /\x00/, name: 'null_byte', severity: XssSeverity.HIGH },
  { pattern: /\uffff/, name: 'bom_character', severity: XssSeverity.MEDIUM },
  { pattern: /\x00|&#0;|&#x0;|%00/, name: 'null_byte_variations', severity: XssSeverity.CRITICAL },

  // --- Angular / Vue / React specific ---
  { pattern: /\[\(.*?\)\]/, name: 'angular_event_binding', severity: XssSeverity.HIGH },
  { pattern: /\*ngRef/i, name: 'angular_ngref', severity: XssSeverity.HIGH },
  { pattern: /v-html\s*=/i, name: 'vue_v_html', severity: XssSeverity.HIGH },
  { pattern: /dangerouslySetInnerHTML/i, name: 'react_dangerous_html', severity: XssSeverity.HIGH },

  // --- Prototype pollution ---
  { pattern: /__proto__/i, name: 'proto_pollution', severity: XssSeverity.HIGH },
  { pattern: /constructor\s*\[\s*["']prototype["']\s*\]/i, name: 'constructor_prototype', severity: XssSeverity.HIGH },

  // --- Base64 encoded payloads ---
  { pattern: /PHNjcmlwd/i, name: 'base64_script_tag', severity: XssSeverity.CRITICAL },
  { pattern: /amF2YXNjcmlwdDov/i, name: 'base64_js_protocol', severity: XssSeverity.CRITICAL },
];

/** Dangerous HTML tags that should be completely removed */
const DANGEROUS_TAGS = [
  'script', 'iframe', 'object', 'embed', 'applet',
  'form', 'input', 'textarea', 'button', 'select',
  'link', 'meta', 'base', 'frame', 'frameset',
  'style', 'svg', 'math', 'video', 'audio',
  'marquee', 'blink', 'xss', 'body', 'html',
  'head', 'title',
];

/** Dangerous attributes that should be removed from any tag */
const DANGEROUS_ATTRIBUTES = [
  'onabort', 'onactivate', 'onafterprint', 'onafterscriptexecute',
  'onanimationcancel', 'onanimationend', 'onanimationiteration',
  'onbeforeactivate', 'onbeforecopy', 'onbeforecut', 'onbeforedeactivate',
  'onbeforepaste', 'onbeforeprint', 'onbeforescriptexecute', 'onbeforeunload',
  'onbegin', 'onblur', 'onbounce', 'oncanplay', 'oncanplaythrough', 'oncellchange',
  'onchange', 'onclick', 'oncontextmenu', 'oncontrolselect', 'oncopy',
  'oncuechange', 'oncut', 'ondblclick', 'ondeactivate', 'ondrag', 'ondragdrop',
  'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 'ondragstart',
  'ondrop', 'ondurationchange', 'onemptied', 'onend', 'onended', 'onerror',
  'onerrorupdate', 'onfilterchange', 'onfinish', 'onfocus', 'onfocusin',
  'onfocusout', 'onhashchange', 'onhelp', 'oninput', 'oninvalid', 'onkeydown',
  'onkeypress', 'onkeyup', 'onlayoutcomplete', 'onload', 'onloadeddata',
  'onloadedmetadata', 'onloadstart', 'onlosecapture', 'onmessage',
  'onmousedown', 'onmouseenter', 'onmouseleave', 'onmousemove', 'onmouseout',
  'onmouseover', 'onmouseup', 'onmousewheel', 'onmove', 'onmoveend',
  'onmovestart', 'onoffline', 'ononline', 'onoutofsync', 'onpageshow',
  'onpaste', 'onpause', 'onplay', 'onplaying', 'onpopstate', 'onprogress',
  'onpropertychange', 'onreadystatechange', 'onrepeat', 'onreset', 'onresize',
  'onresizeend', 'onresizestart', 'onscroll', 'onsearch', 'onseek',
  'onseeked', 'onseeking', 'onselect', 'onselectionchange', 'onselectstart',
  'onstart', 'onstorage', 'onsubmit', 'onsuspend', 'onsyncrestored',
  'ontimeupdate', 'ontoggle', 'ontouchend', 'ontouchmove', 'ontouchstart',
  'ontrackchange', 'ontransitioncancel', 'ontransitionend', 'ontransitionrun',
  'onunload', 'onurlflip', 'onuserproximity', 'onvolumechange', 'onwaiting',
  'onwebkitanimationend', 'onwebkitanimationiteration', 'onwebkitanimationstart',
  'onwebkittransitionend', 'onwheel',
  // Additional dangerous attributes
  'formaction', 'formmethod', 'formtarget', 'formenctype', 'formnovalidate',
  'ping', 'accesskey',
];

/** HTML entities mapping for encoding */
const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/** Characters to strip from filenames */
const FILENAME_DANGEROUS_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

@Injectable()
export class XssSanitizerService {
  private readonly logger = new Logger(XssSanitizerService.name);
  private strictMode: boolean;

  constructor(private readonly configService: ConfigService) {
    this.strictMode = this.configService.get<boolean>('XSS_STRICT_MODE', true);
  }

  /**
   * Detect XSS patterns in input and return detailed analysis.
   * This is the primary detection method used by guards.
   */
  detectXss(input: string): XssDetectionResult {
    const detectedPatterns: string[] = [];
    let maxSeverity = XssSeverity.LOW;

    for (const { pattern, name, severity } of XSS_PATTERNS) {
      if (pattern.test(input)) {
        detectedPatterns.push(name);
        if (this.severityRank(severity) > this.severityRank(maxSeverity)) {
          maxSeverity = severity;
        }
      }
    }

    const isMalicious = detectedPatterns.length > 0;
    const sanitizedValue = isMalicious ? this.sanitize(input) : input;

    if (isMalicious) {
      this.logger.warn(`XSS detected: patterns=[${detectedPatterns.join(', ')}], severity=${maxSeverity}`);
    }

    return {
      isMalicious,
      severity: maxSeverity,
      detectedPatterns,
      sanitizedValue,
      originalLength: input.length,
    };
  }

  /**
   * Sanitize user input by removing dangerous HTML and encoding special characters.
   * This is the primary sanitization method.
   */
  sanitize(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Step 1: Remove null bytes and control characters
    sanitized = this.removeNullBytes(sanitized);

    // Step 2: Remove dangerous HTML tags
    sanitized = this.removeDangerousTags(sanitized);

    // Step 3: Remove dangerous attributes
    sanitized = this.removeDangerousAttributes(sanitized);

    // Step 4: Remove event handlers from remaining tags
    sanitized = this.removeEventHandlers(sanitized);

    // Step 5: Remove javascript: and other dangerous protocols
    sanitized = this.removeDangerousProtocols(sanitized);

    // Step 6: In strict mode, encode all HTML entities
    if (this.strictMode) {
      sanitized = this.encodeHtmlEntities(sanitized);
    }

    return sanitized;
  }

  /**
   * Sanitize with DOMPurify-like behavior - strip all HTML.
   * Use for text fields where HTML is not expected.
   */
  sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Strip ALL HTML tags
    return input
      .replace(/<[^>]*>/gi, '')
      .replace(/[<>]/g, '')
      .trim();
  }

  /**
   * Sanitize HTML content - allow only safe tags and attributes.
   * Use for rich text fields where limited HTML is expected.
   */
  sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Allowed safe tags
    const allowedTags = new Set([
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2',
      'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote',
      'code', 'pre', 'a', 'img', 'table', 'thead', 'tbody',
      'tr', 'td', 'th', 'div', 'span', 'hr',
    ]);

    // Allowed attributes per tag
    const allowedAttributes: Record<string, Set<string>> = {
      a: new Set(['href', 'title', 'target']),
      img: new Set(['src', 'alt', 'title', 'width', 'height']),
      '*': new Set(['class', 'id']),
    };

    // Remove all tags except allowed ones
    let sanitized = input.replace(/<(\/?)(\w+)([^>]*)>/gi, (match, slash, tagName, attrs) => {
      const lowerTag = tagName.toLowerCase();

      if (!allowedTags.has(lowerTag)) {
        return '';
      }

      // Parse and filter attributes
      const safeAttrs = this.filterAttributes(lowerTag, attrs, allowedAttributes);
      return `<${slash}${lowerTag}${safeAttrs}>`;
    });

    // Remove any remaining event handlers
    sanitized = this.removeEventHandlers(sanitized);

    // Remove javascript: protocol from href/src
    sanitized = this.removeDangerousProtocols(sanitized);

    return sanitized;
  }

  /**
   * Sanitize search queries - remove XSS vectors while preserving search functionality.
   */
  sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return '';
    }

    let sanitized = query;

    // Remove HTML tags completely
    sanitized = sanitized.replace(/<[^>]*>/gi, '');

    // Remove dangerous characters but preserve search operators
    sanitized = sanitized.replace(/[<>\"'`{}]/g, '');

    // Remove null bytes
    sanitized = sanitized.replace(/\x00/g, '');

    // Limit length (prevent ReDoS on search)
    const maxQueryLength = 500;
    if (sanitized.length > maxQueryLength) {
      sanitized = sanitized.substring(0, maxQueryLength);
    }

    return sanitized.trim();
  }

  /**
   * Sanitize file names - remove path traversal and dangerous characters.
   */
  sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      return 'unnamed';
    }

    let sanitized = fileName;

    // Remove path traversal sequences
    sanitized = sanitized.replace(/\.\.[\\/]/g, '');
    sanitized = sanitized.replace(/^[\\/]+/, '');

    // Remove null bytes
    sanitized = sanitized.replace(/\x00/g, '');

    // Remove dangerous characters
    sanitized = sanitized.replace(FILENAME_DANGEROUS_CHARS, '_');

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1f]/g, '');

    // Remove script-like extensions
    const dangerousExtensions = /\.(exe|dll|bat|cmd|sh|php|jsp|asp|aspx|py|rb|pl)$/i;
    sanitized = sanitized.replace(dangerousExtensions, '.txt');

    // Ensure filename is not empty
    if (!sanitized || sanitized === '.' || sanitized === '..') {
      sanitized = 'unnamed';
    }

    // Limit length
    const maxFileNameLength = 255;
    if (sanitized.length > maxFileNameLength) {
      const ext = sanitized.lastIndexOf('.');
      if (ext > 0) {
        sanitized = sanitized.substring(0, maxFileNameLength - (sanitized.length - ext)) + sanitized.substring(ext);
      } else {
        sanitized = sanitized.substring(0, maxFileNameLength);
      }
    }

    return sanitized;
  }

  /**
   * Sanitize URL parameters.
   */
  sanitizeUrlParam(param: string): string {
    if (!param || typeof param !== 'string') {
      return '';
    }

    return this.encodeHtmlEntities(param);
  }

  /**
   * Encode HTML entities for safe output rendering.
   * OWASP: Use HTML entity encoding for HTML body context.
   */
  encodeHtmlEntities(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input.replace(
      /[&<>"'`\/=]/g,
      (char) => HTML_ENTITY_MAP[char] || char,
    );
  }

  /**
   * Encode for JavaScript context (inside <script> tags).
   * OWASP: Use \xHH encoding for JavaScript context.
   */
  encodeForJs(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/</g, '\\x3c')
      .replace(/>/g, '\\x3e');
  }

  /**
   * Encode for CSS context.
   * OWASP: Use \HHH encoding for CSS context.
   */
  encodeForCss(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input.replace(/[^a-zA-Z0-9\-_.\s]/g, (char) => {
      const hex = char.charCodeAt(0).toString(16);
      return `\\${hex.padStart(6, '0')} `;
    });
  }

  /**
   * Encode for URL context.
   */
  encodeForUrl(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return encodeURIComponent(input);
  }

  /**
   * Deep sanitize an object - recursively sanitize all string values.
   */
  deepSanitize<T>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitize(obj) as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepSanitize(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.deepSanitize(value);
      }
      return sanitized as T;
    }

    return obj;
  }

  // --- Private helper methods ---

  private removeNullBytes(input: string): string {
    return input
      .replace(/\x00/g, '')
      .replace(/\\x00/g, '')
      .replace(/&#0;|&#x0;/gi, '');
  }

  private removeDangerousTags(input: string): string {
    const tagPattern = new RegExp(
      `<\\/?(?:${DANGEROUS_TAGS.join('|')})\\b[^>]*>`,
      'gi',
    );
    return input.replace(tagPattern, '');
  }

  private removeDangerousAttributes(input: string): string {
    const attrPattern = new RegExp(
      `\\s(?:${DANGEROUS_ATTRIBUTES.join('|')})\\s*=\\s*["']?[^"'>]*`,
      'gi',
    );
    return input.replace(attrPattern, '');
  }

  private removeEventHandlers(input: string): string {
    return input.replace(/\s(on\w+)\s*=\s*"[^"]*"/gi, '')
      .replace(/\s(on\w+)\s*=\s*'[^']*'/gi, '')
      .replace(/\s(on\w+)\s*=\s*[^\s>]+/gi, '');
  }

  private removeDangerousProtocols(input: string): string {
    return input
      .replace(/(href|src|action|background|dynsrc|lowsrc|formaction)\s*=\s*["']?javascript:/gi, '$1=#blocked')
      .replace(/(href|src|action|background|dynsrc|lowsrc|formaction)\s*=\s*["']?vbscript:/gi, '$1=#blocked')
      .replace(/(href|src|action|background|dynsrc|lowsrc|formaction)\s*=\s*["']?data:\s*text\/html/gi, '$1=#blocked')
      .replace(/(href|src|action|background|dynsrc|lowsrc|formaction)\s*=\s*["']?mhtml:/gi, '$1=#blocked')
      .replace(/javascript:/gi, '#blocked')
      .replace(/vbscript:/gi, '#blocked');
  }

  private filterAttributes(
    tagName: string,
    attrs: string,
    allowedAttributes: Record<string, Set<string>>,
  ): string {
    const globalAllowed = allowedAttributes['*'] || new Set();
    const tagAllowed = allowedAttributes[tagName] || new Set();
    const allAllowed = new Set([...globalAllowed, ...tagAllowed]);

    if (allAllowed.size === 0) {
      return '';
    }

    const attrRegex = /(\w+)\s*=\s*(["'])(.*?)\2/g;
    let match: RegExpExecArray | null;
    let safeAttrs = '';

    while ((match = attrRegex.exec(attrs)) !== null) {
      const attrName = match[1].toLowerCase();
      const attrValue = match[3];

      if (allAllowed.has(attrName)) {
        // Sanitize href and src values
        if ((attrName === 'href' || attrName === 'src') && /^javascript:/i.test(attrValue)) {
          continue;
        }
        safeAttrs += ` ${attrName}="${this.encodeHtmlEntities(attrValue)}"`;
      }
    }

    return safeAttrs;
  }

  private severityRank(severity: XssSeverity): number {
    const ranks: Record<XssSeverity, number> = {
      [XssSeverity.LOW]: 1,
      [XssSeverity.MEDIUM]: 2,
      [XssSeverity.HIGH]: 3,
      [XssSeverity.CRITICAL]: 4,
    };
    return ranks[severity] || 0;
  }
}
