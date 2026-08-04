import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageJsonPath = path.join(__dirname, '..', 'package.json')

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const versionParts = String(packageJson.version ?? '0.0.0')
  .split('.')
  .map((part) => Number.parseInt(part, 10))

if (versionParts.length !== 3 || versionParts.some(Number.isNaN)) {
  throw new Error(`Unsupported version format: ${packageJson.version}`)
}

versionParts[2] += 1
packageJson.version = versionParts.join('.')

writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)
console.log(`Bumped version to ${packageJson.version}`)
