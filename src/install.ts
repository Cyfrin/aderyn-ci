import * as exec from '@actions/exec'

async function installAderyn0_5() {
  await exec.exec('npm install -g @cyfrin/aderyn@0.5')
}

export { installAderyn0_5 }
