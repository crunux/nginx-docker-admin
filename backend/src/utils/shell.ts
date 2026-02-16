import { $ } from 'bun'

export const run = async (cmd: string): Promise<string> => {
  const result = await $`${{ raw: cmd }}`.text()
  return result
}

// O más seguro pasando args separados:
export const runArgs = async (...args: string[]): Promise<string> => {
  const proc = Bun.spawn(args, { stdout: 'pipe', stderr: 'pipe' })
  const out = await new Response(proc.stdout).text()
  const err = await new Response(proc.stderr).text()
  await proc.exited
  return out + err
}