import fs from 'fs'

export interface FileSymbols {
  purpose: string | null
  exports: string[]
  language: string
}

export function extractSymbols(absolutePath: string, ext: string): FileSymbols {
  let content: string
  try {
    const buf = Buffer.alloc(32768)
    const fd = fs.openSync(absolutePath, 'r')
    const bytesRead = fs.readSync(fd, buf, 0, 32768, 0)
    fs.closeSync(fd)
    content = buf.toString('utf-8', 0, bytesRead)
  } catch {
    return empty('unknown')
  }
  return extractSymbolsFromContent(content, ext)
}

export function extractSymbolsFromContent(content: string, ext: string): FileSymbols {
  switch (ext) {
    case '.ts':
    case '.tsx':
    case '.js':
    case '.jsx':
    case '.mjs':
    case '.cjs':
      return extractJS(content)
    case '.py':
      return extractPython(content)
    case '.go':
      return extractGo(content)
    case '.rs':
      return extractRust(content)
    case '.java':
    case '.kt':
      return extractJava(content)
    case '.rb':
      return extractRuby(content)
    case '.php':
      return extractPhp(content)
    default:
      return empty('text')
  }
}

function empty(language: string): FileSymbols {
  return { purpose: null, exports: [], language }
}


function extractJS(content: string): FileSymbols {
  const purpose = extractJSPurpose(content)
  const exports = new Set<string>()

  for (const m of content.matchAll(/^export\s+(?:async\s+)?function\s+(\w+)/gm)) {
    exports.add(m[1])
  }
  for (const m of content.matchAll(/^export\s+(?:abstract\s+|default\s+)?class\s+(\w+)/gm)) {
    exports.add(m[1])
  }
  for (const m of content.matchAll(/^export\s+(?:const|let)\s+(\w+)/gm)) {
    exports.add(m[1])
  }
  for (const m of content.matchAll(/^export\s+(?:type|interface)\s+(\w+)/gm)) {
    exports.add(m[1])
  }
  for (const m of content.matchAll(/^export\s+enum\s+(\w+)/gm)) {
    exports.add(m[1])
  }
  const defFn = content.match(/^export\s+default\s+(?:async\s+)?(?:function|class)\s+(\w+)/m)
  if (defFn) exports.add(`default:${defFn[1]}`)

  for (const m of content.matchAll(/^export\s+\{([^}]+)\}(?!\s+from)/gm)) {
    for (const name of m[1].split(',').map((s) => s.trim().split(/\s+as\s+/).pop()!.trim())) {
      if (name && /^\w+$/.test(name)) exports.add(name)
    }
  }

  return { purpose, exports: dedup(exports), language: 'typescript' }
}

function extractJSPurpose(content: string): string | null {
  const jsdoc = content.match(/^\s*\/\*\*\s*\n\s*\*\s*([^\n@*][^\n]*)/)
  if (jsdoc) return jsdoc[1].trim()
  const lines = content.split('\n').slice(0, 5)
  for (const line of lines) {
    const m = line.match(/^\s*\/\/\s*([^/!\n].{3,})/)
    if (m) return m[1].trim()
  }
  return null
}


function extractPython(content: string): FileSymbols {
  const exports = new Set<string>()

  const docMatch = content.match(/^(?:"""([^"]*?)"""|'''([^']*?)''')/s)
  const purpose = docMatch
    ? (docMatch[1] ?? docMatch[2]).split('\n')[0].trim() || null
    : null

  for (const m of content.matchAll(/^(?:async\s+)?def\s+(\w+)/gm)) {
    if (!m[1].startsWith('_')) exports.add(m[1])
  }
  for (const m of content.matchAll(/^class\s+(\w+)/gm)) {
    exports.add(m[1])
  }

  return { purpose, exports: dedup(exports), language: 'python' }
}


function extractGo(content: string): FileSymbols {
  const exports = new Set<string>()

  const pkgComment = content.match(/^\/\/\s*(.+)\npackage\s/)
  const purpose = pkgComment ? pkgComment[1].trim() : null

  for (const m of content.matchAll(/^func\s+(?:\(\w+\s+\*?\w+\)\s+)?([A-Z]\w*)/gm)) {
    exports.add(m[1])
  }
  for (const m of content.matchAll(/^type\s+([A-Z]\w+)/gm)) {
    exports.add(m[1])
  }
  for (const m of content.matchAll(/^(?:var|const)\s+([A-Z]\w+)/gm)) {
    exports.add(m[1])
  }

  return { purpose, exports: dedup(exports), language: 'go' }
}


function extractRust(content: string): FileSymbols {
  const exports = new Set<string>()

  for (const m of content.matchAll(/^pub\s+(?:async\s+)?fn\s+(\w+)/gm)) {
    exports.add(m[1])
  }
  for (const m of content.matchAll(/^pub\s+(?:struct|enum|trait|type)\s+(\w+)/gm)) {
    exports.add(m[1])
  }

  return { purpose: null, exports: dedup(exports), language: 'rust' }
}


function extractJava(content: string): FileSymbols {
  const exports = new Set<string>()

  for (const m of content.matchAll(/^public\s+(?:abstract\s+|final\s+|static\s+)?(?:class|interface|enum|record)\s+(\w+)/gm)) {
    exports.add(m[1])
  }
  for (const m of content.matchAll(/^\s+public\s+(?:static\s+)?(?:final\s+)?\w[\w<>, ]*\s+(\w+)\s*\(/gm)) {
    if (m[1] !== 'class' && !exports.has(m[1])) exports.add(m[1])
  }
  for (const m of content.matchAll(/^(?:fun|class|object|data class|sealed class)\s+(\w+)/gm)) {
    exports.add(m[1])
  }

  return { purpose: null, exports: dedup(exports), language: 'java' }
}


function extractRuby(content: string): FileSymbols {
  const exports = new Set<string>()

  for (const m of content.matchAll(/^(?:class|module)\s+(\w+)/gm)) {
    exports.add(m[1])
  }
  for (const m of content.matchAll(/^\s+def\s+(\w+)/gm)) {
    if (!m[1].startsWith('_')) exports.add(m[1])
  }

  return { purpose: null, exports: dedup(exports), language: 'ruby' }
}


function extractPhp(content: string): FileSymbols {
  const exports = new Set<string>()

  for (const m of content.matchAll(/^(?:class|interface|trait|enum)\s+(\w+)/gm)) {
    exports.add(m[1])
  }
  for (const m of content.matchAll(/^\s+public\s+(?:static\s+)?function\s+(\w+)/gm)) {
    exports.add(m[1])
  }
  for (const m of content.matchAll(/^function\s+(\w+)/gm)) {
    exports.add(m[1])
  }

  return { purpose: null, exports: dedup(exports), language: 'php' }
}


function dedup(set: Set<string>): string[] {
  return [...set].slice(0, 10)
}
