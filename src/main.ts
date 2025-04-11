import * as core from '@actions/core'
import { FailOn, validateFailOn } from './config.js'
import { installAderyn0_5 } from './install.js'
import { runAderyn0_5 } from './run.js'
import { rmRF } from '@actions/io'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const failOn: string = core.getInput('fail-on')

    // Validate input
    if (!validateFailOn(failOn)) {
      throw new Error(`${failOn} must be one of "low", "high", "both"`)
    }

    // Install the aderyn tool
    await installAderyn0_5()

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
