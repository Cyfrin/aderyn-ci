enum FailOn {
  High = 'high',
  Low = 'low',
  Both = 'both'
}

function validateFailOn(arg: string): boolean {
  return arg === FailOn.Low || arg === FailOn.Both || arg === FailOn.High
}

export { FailOn, validateFailOn }
