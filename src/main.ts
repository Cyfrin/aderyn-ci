import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import { rmRF } from '@actions/io'

enum FailOn {
  High = 'high',
  Low = 'low',
  Both = 'both'
}

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const failOn: string = core.getInput('fail-on')

    // Validate input
    if (
      failOn !== FailOn.Low &&
      failOn !== FailOn.Both &&
      failOn !== FailOn.High
    ) {
      throw new Error(`${failOn} must be one of "low", "high", "both"`)
    }

    // Install the aderyn tool
    await exec.exec('npm install -g @cyfrin/aderyn@0.5')

    // Run aderyn on the repository
    const { high, low, data: markdown } = await runAderyn0_5()
    core.info(markdown)

    switch (failOn) {
      case FailOn.Both:
        if (high != '0' || low != '0') {
          throw new Error('High and low issues caught!')
        }
        break
      case FailOn.Low:
        if (low != '0') {
          throw new Error('low issues caught!')
        }
        break
      case FailOn.High:
        if (high != '0') {
          throw new Error('High issues caught!')
        }
        break
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  } finally {
    // Cleanup reports before next CI step
    await rmRF('aderyn-report.json')
    await rmRF('aderyn-report.md')
  }
}

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
