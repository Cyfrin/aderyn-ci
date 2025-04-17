import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import { rmRF } from '@actions/io'

export async function run(): Promise<void> {
  try {
    // Gather Input
    const failOn: string = core.getInput('fail-on')
    const warnOn: string = core.getInput('warn-on')
    const workDir: string = core.getInput('working-directory')
    const input: Input = { failOn, warnOn, workDir }

    // Step 1: Validate input
    ensureInputConstraints(input)

    // Step 2: Install Aderyn
    await installAderyn()

    // Step 3: Run aderyn on the repository
    const report = await getReport(workDir)

    // Step 4: Act on report
    await actOnReportForGivenInput(input, report)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

// Types
enum Contstraints {
  High = 'high',
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
      'Do not use `working-directory`. Please use `aderyn.toml` instead. Read here to find how - https://cyfrin.gitbook.io/cyfrin-docs/aderyn-vs-code/aderyn.toml-configuration'
    )
  }

  if (failOn === Contstraints.Undefined && warnOn === Contstraints.Undefined) {
    throw new Error(
      'Received no input for action. Expected one of "fail-on", "warn-on"'
    )
  }

  const passesConstraintsCheck = (argument: string): boolean => {
    return (
      argument === Contstraints.Undefined ||
      argument === Contstraints.Any ||
      argument === Contstraints.High
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

  await exec.exec(`aderyn ${cwd} -o ${mdReportName} --highs-only`)
  await exec.exec(`aderyn ${cwd} -o ${jsonReportName}`)

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
async function actOnReportForGivenInput(input: Input, report: Report) {
  const { failOn, warnOn } = input

  core.debug('Markdown report by running aderyn')
  core.debug(report.mdContent)

  const createMessage = (category: string): string => {
    let message = `${category} issues found. To see the issues, run "aderyn" in the workspace root of the project.\n`
    message += `Take any of the following action:\n`
    message += `1. Fix the issue reported\n`
    message += `2. Nudge Aderyn to ignore these issues. Instructions at https://cyfrin.gitbook.io/cyfrin-docs/directives-to-ignore-specific-lines\n`
    return message
  }

  if (failOn === Contstraints.High) {
    if (report.high !== 0) {
      core.setFailed(createMessage('High'))
    }
  } else if (failOn === Contstraints.Any) {
    if (report.high !== 0 || report.low !== 0) {
      core.setFailed(createMessage('Some'))
    }
  } else if (warnOn === Contstraints.High) {
    if (report.high !== 0) {
      core.warning(createMessage('High'))
    }
  } else if (warnOn === Contstraints.Any) {
    if (report.high !== 0 || report.low !== 0) {
      core.warning(createMessage('Some'))
    }
  }
}
