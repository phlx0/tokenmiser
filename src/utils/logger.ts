import chalk from 'chalk'

export const log = {
  header: (msg: string) => console.log(chalk.bold.white('\n  ' + msg)),
  step: (msg: string) => process.stdout.write(chalk.blue('  → ') + msg),
  stepDone: (result: string) => console.log(' ' + chalk.green(result)),
  success: (msg: string) => console.log(chalk.green('  ✓ ') + msg),
  warn: (msg: string) => console.log(chalk.yellow('  ⚠ ') + msg),
  error: (msg: string) => console.log(chalk.red('  ✗ ') + msg),
  info: (msg: string) => console.log(chalk.dim('    ' + msg)),
  blank: () => console.log(),
  divider: () => console.log(chalk.dim('  ' + '─'.repeat(60))),
  stat: (label: string, value: string, highlight = false) => {
    const v = highlight ? chalk.green(value) : chalk.white(value)
    console.log(`  ${chalk.dim(label.padEnd(28))} ${v}`)
  },
}
