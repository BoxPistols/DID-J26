#!/usr/bin/env node

/**
 * Docs Index Generator
 *
 * docs/ 配下のMarkdownファイルを自動スキャンして、
 * カテゴリ別に整理されたREADME.mdを生成します。
 *
 * Usage:
 *   node scripts/generate-docs-index.js
 *   npm run docs:index
 */

const fs = require('fs')
const path = require('path')

const DOCS_DIR = path.join(__dirname, '../docs')
const OUTPUT_FILE = path.join(DOCS_DIR, 'README.md')

// カテゴリ定義（表示順序も兼ねる）
const CATEGORIES = {
  data: {
    title: '📊 データ関連',
    description: 'DIDデータ、空港データ、地形データの取得・更新・配布に関するドキュメント'
  },
  api: {
    title: '🔌 API・外部連携',
    description: 'ドローン運航API、気象API、外部サービス連携に関するドキュメント'
  },
  specifications: {
    title: '📐 仕様書',
    description: 'プロジェクト要件定義、機能仕様、アーキテクチャ設計'
  },
  architecture: {
    title: '🏗️ アーキテクチャ',
    description: 'システム構成、データフロー、設計原則に関するドキュメント'
  },
  development: {
    title: '🛠️ 開発ガイド',
    description: '開発環境、CI/CD、パッケージ化、タスク管理'
  },
  'getting-started': {
    title: '🚀 はじめての方へ',
    description: '環境構築、クイックスタート、オンボーディング'
  },
  'ai-driven': {
    title: '🤖 AI駆動開発',
    description: 'AIツールの活用方法、ベストプラクティス'
  }
}

/**
 * Markdownファイルから最初の# タイトルを抽出
 */
function extractTitle(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const match = content.match(/^#\s+(.+)$/m)
    return match ? match[1] : path.basename(filePath, '.md')
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message)
    return path.basename(filePath, '.md')
  }
}

/**
 * Markdownファイルから最初の段落（説明文）を抽出
 */
function extractDescription(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    // タイトル行の後、最初の空行でない行を取得
    const lines = content.split('\n')
    let foundTitle = false
    for (const line of lines) {
      if (line.match(/^#\s+/)) {
        foundTitle = true
        continue
      }
      if (foundTitle && line.trim() && !line.match(/^[-=]+$/) && !line.match(/^#/)) {
        return line.trim()
      }
    }
    return ''
  } catch (error) {
    return ''
  }
}

/**
 * ディレクトリ内のMarkdownファイルを再帰的に取得
 */
function getMarkdownFiles(dir, baseDir = dir) {
  const files = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(fullPath, baseDir))
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') {
      const relativePath = path.relative(baseDir, fullPath)
      const category = relativePath.split(path.sep)[0]

      files.push({
        path: fullPath,
        relativePath: relativePath.replace(/\\/g, '/'), // Windows対応
        fileName: entry.name,
        category: CATEGORIES[category] ? category : 'other',
        title: extractTitle(fullPath),
        description: extractDescription(fullPath)
      })
    }
  }

  return files
}

/**
 * README.mdを生成
 */
function generateReadme() {
  const files = getMarkdownFiles(DOCS_DIR)

  // カテゴリ別にグループ化
  const grouped = {}
  for (const category of Object.keys(CATEGORIES)) {
    grouped[category] = files.filter(f => f.category === category)
  }

  // その他のファイル
  const others = files.filter(f => f.category === 'other')

  // Markdown生成
  const lines = [
    '# ドキュメント索引',
    '',
    'このドキュメントは自動生成されています。',
    '**更新方法:** `npm run docs:index`',
    '',
    '---',
    '',
    '## 📋 目次',
    ''
  ]

  // 目次生成
  for (const [category, info] of Object.entries(CATEGORIES)) {
    if (grouped[category].length > 0) {
      lines.push(`- [${info.title}](#${category})`)
    }
  }
  if (others.length > 0) {
    lines.push('- [その他](#その他)')
  }

  lines.push('', '---', '')

  // 各カテゴリのセクション
  for (const [category, info] of Object.entries(CATEGORIES)) {
    const categoryFiles = grouped[category]
    if (categoryFiles.length === 0) continue

    lines.push(`## ${info.title}`, '')
    lines.push(info.description, '')

    for (const file of categoryFiles.sort((a, b) => a.fileName.localeCompare(b.fileName))) {
      lines.push(`### [${file.title}](./${file.relativePath})`)
      if (file.description) {
        lines.push('', file.description)
      }
      lines.push('')
    }

    lines.push('---', '')
  }

  // その他
  if (others.length > 0) {
    lines.push('## その他', '')
    for (const file of others) {
      lines.push(`- [${file.title}](./${file.relativePath})`)
    }
    lines.push('')
  }

  // フッター
  lines.push('---', '')
  lines.push(`**最終更新:** ${new Date().toISOString().split('T')[0]}`)
  lines.push('**生成コマンド:** \`npm run docs:index\`')
  lines.push('')

  // ファイル書き込み
  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf-8')
  console.log(`✅ Generated: ${OUTPUT_FILE}`)
  console.log(`📄 Total files: ${files.length}`)

  // 統計表示
  for (const [category, info] of Object.entries(CATEGORIES)) {
    const count = grouped[category].length
    if (count > 0) {
      console.log(`   ${info.title}: ${count}`)
    }
  }
  if (others.length > 0) {
    console.log(`   その他: ${others.length}`)
  }
}

// 実行
try {
  generateReadme()
} catch (error) {
  console.error('❌ Error generating docs index:', error)
  process.exit(1)
}
