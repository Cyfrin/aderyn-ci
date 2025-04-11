import * as exec from '@actions/exec'
import * as fs from 'fs'

async function runAderyn0_5() {
  // Create reports
  await exec.exec('aderyn  -o aderyn-report.json')
  const data = fs.readFileSync('aderyn-report.json', 'utf8')
  const parsed = JSON.parse(data)

  await exec.exec('aderyn -o aderyn-report.md')
  const markdown = fs.readFileSync('aderyn-report.md', 'utf8')

  return {
    high: parsed['issue_count']['high'],
    low: parsed['issue_count']['low'],
    data: markdown.toString()
  }
}

export { runAderyn0_5 }
