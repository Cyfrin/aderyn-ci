import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import { rmRF } from '@actions/io'

export async function run(): Promise<void> {
  try {
    // Gather Input
    const input: Input = {
      failOn: core.getInput('fail-on'),
      warnOn: core.getInput('warn-on'),
      workDir: core.getInput('working-directory')
    }

    // Step 1: Validate input
    ensureInputConstraints(input)

    // Step 2: Install Aderyn
    await installAderyn()

    // Step 3: Run aderyn on the repository
    const report = await getReport(input.workDir)

    // Step 4: Print summary
    printSummary(report)

    // Step 5: Act on report
    await actOnReportForGivenInput(input, report)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

// Types
enum Contstraints {
  High = 'high',
  Low = 'low',
  Any = 'any',
  Undefined = ''
}

interface Report {
  high: number
  low: number
  mdContent: string
}

interface Input {
  failOn: string
  warnOn: string
  workDir: string
}

// Step 1
function ensureInputConstraints(input: Input) {
  const { failOn, warnOn, workDir } = input

  if (workDir !== Contstraints.Undefined) {
    core.warning(
      'Do not use `working-directory`. Please configure the root in `aderyn.toml` instead. Read here to find how - https://cyfrin.gitbook.io/cyfrin-docs/aderyn-vs-code/aderyn.toml-configuration'
    )
  }

  if (failOn === Contstraints.Undefined && warnOn === Contstraints.Undefined) {
    throw new Error(
      'Received no input for action. Expected one of "fail-on", "warn-on"'
    )
  }

  if (failOn.includes(',') || warnOn.includes(',')) {
    throw new Error(
      'No "," allowed. Hint: Use "any" to include high and low issues'
    )
  }

  const passesConstraintsCheck = (argument: string): boolean => {
    return (
      argument === Contstraints.Undefined ||
      argument === Contstraints.Any ||
      argument === Contstraints.High ||
      argument === Contstraints.Low
    )
  }
  if (!passesConstraintsCheck(failOn)) {
    throw new Error(`given fail-on: ${failOn}. Expected one of "high", "any"`)
  }
  if (!passesConstraintsCheck(warnOn)) {
    throw new Error(`given warn-on: ${warnOn}. Expected one of "high", "any"`)
  }
}

// Step 2
async function installAderyn() {
  await exec.exec('npm install -g @cyfrin/aderyn@0.5') // Max verison allowed for v0 is going to be 0.5.X aderyn
}

// Step 3
async function getReport(rworkDir: string): Promise<Report> {
  const cwd = rworkDir !== Contstraints.Undefined ? rworkDir : '.'

  const r = Math.round(Math.random() * 100000).toString()
  const mdReportName = `aderyn-report-${r}.md`
  const jsonReportName = `aderyn-report-${r}.json`

  await exec.exec(
    `aderyn ${cwd} -o ${mdReportName} --no-snippets --skip-update-check`
  )
  await exec.exec(
    `aderyn ${cwd} -o ${jsonReportName} --skip-update-check`,
    [],
    { silent: true }
  )

  const parsed = JSON.parse(fs.readFileSync(jsonReportName, 'utf8'))
  const markdown = fs.readFileSync(mdReportName, 'utf8')

  const report = {
    high: parseInt(parsed['issue_count']['high']),
    low: parseInt(parsed['issue_count']['low']),
    mdContent: markdown.toString()
  }

  await rmRF(mdReportName)
  await rmRF(jsonReportName)

  return report
}

// Step 4
function printSummary(report: Report) {
  core.info('Markdown report by running aderyn')
  core.info('Summary')

  if (report.high === 0 && report.low === 0) {
    core.info('No issues found!')
  } else if (report.high === 0) {
    core.info('No high issues found!')
  } else if (report.low === 0) {
    core.info('No low issues found!')
  }

  if (report.high !== 0 && report.low !== 0) {
    core.info('High and low issues found!')
  } else if (report.high !== 0) {
    core.info(`${report.high} High issues found!`)
  } else if (report.low !== 0) {
    core.info(`${report.low} Low issues found!`)
  }
}

// Step 5
async function actOnReportForGivenInput(input: Input, report: Report) {
  const { failOn, warnOn } = input

  const createMessage = (): string => {
    let message = ''
    message += `${report.high === 0 ? 'No' : report.high} high issues were found and ${report.low === 0 ? 'no' : report.low} low issues were found.\n`
    message += `Install and run aderyn locally to view the issues in detail\n`
    message += `1. VSCode extension - https://marketplace.visualstudio.com/items?itemName=Cyfrin.aderyn\n`
    message += `2. CLI - https://github.com/Cyfrin\n\n`
    message += `Take any of the following action:\n`
    message += `1. Fix the issues reported\n`
    message += `2. Nudge Aderyn to ignore these issues. Instructions at https://cyfrin.gitbook.io/cyfrin-docs/directives-to-ignore-specific-lines\n`
    return message
  }

  // Fulfill failOn
  if (failOn === Contstraints.High) {
    if (report.high !== 0) {
      core.info('\n')
      core.setFailed(createMessage())
    }
  } else if (failOn === Contstraints.Low) {
    if (report.low !== 0) {
      core.info('\n')
      core.setFailed(createMessage())
    }
  } else if (failOn === Contstraints.Any) {
    if (report.high !== 0 || report.low !== 0) {
      core.info('\n')
      core.setFailed(createMessage())
    }
  }

  // Fulfill warnOn
  if (warnOn === Contstraints.High) {
    if (report.high !== 0) {
      core.info('\n')
      core.warning(createMessage())
    }
  } else if (warnOn === Contstraints.Low) {
    if (report.low !== 0) {
      core.info('\n')
      core.warning(createMessage())
    }
  } else if (warnOn === Contstraints.Any) {
    if (report.high !== 0 || report.low !== 0) {
      core.info('\n')
      core.warning(createMessage())
    }
  }
}
