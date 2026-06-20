import { chmod, mkdir, readFile, stat, unlink, writeFile } from 'fs/promises'
import { dirname, relative } from 'path'

// Inlined, ESM port of npm's `cmd-shim`. On Windows, creates a node_modules/.bin
// shim trio (sh, .cmd, .ps1) for a package bin, reading its shebang to find the
// interpreter. Behaviour and templates mirror the upstream module.

// eslint-disable-next-line no-control-regex
const shebangExpr = /^#!\s*(?:\/usr\/bin\/env\s+(?:-S\s+)?((?:[^ \t=]+=[^ \t=]+\s+)*))?([^ \t]+)(.*)$/

const replaceDollarWithPercentPair = (value) => {
  const dollarExpressions = /\$\{?([^$@#?\- \t{}:]+)\}?/g
  let result = ''
  let startIndex = 0
  let match
  do {
    match = dollarExpressions.exec(value)
    if (match) {
      result += (value.substring(startIndex, match.index) || '') + '%' + match[1] + '%'
      startIndex = dollarExpressions.lastIndex
    }
  } while (dollarExpressions.lastIndex > 0)
  return result + value.slice(startIndex)
}

const convertToSetCommands = (variableString) => {
  let batch = ''
  for (const declaration of variableString.split(' ')) {
    const [key, value] = declaration.split('=')
    const k = (key || '').trim()
    const v = (value || '').trim()
    if (k && v) batch += '@SET ' + k + '=' + replaceDollarWithPercentPair(v) + '\r\n'
  }
  return batch
}

const rm = (path) => unlink(path).catch(() => {})

const writeShim = (from, to, prog, args, variables) => {
  let shTarget = relative(dirname(to), from).split('\\').join('/')
  let target = shTarget.split('/').join('\\')
  let pwshTarget = shTarget
  let longProg
  let shProg = prog && prog.split('\\').join('/')
  let shLongProg
  let pwshProg = shProg && `"${shProg}$exe"`
  let pwshLongProg
  args = args || ''
  variables = variables || ''
  if (!prog) {
    prog = `"%dp0%\\${target}"`
    shProg = `"$basedir/${shTarget}"`
    pwshProg = shProg
    args = ''
    target = ''
    shTarget = ''
    pwshTarget = ''
  } else {
    longProg = `"%dp0%\\${prog}.exe"`
    shLongProg = `"$basedir/${prog}"`
    pwshLongProg = `"$basedir/${prog}$exe"`
    target = `"%dp0%\\${target}"`
    shTarget = `"$basedir_win/${shTarget}"`
    pwshTarget = `"$basedir/${pwshTarget}"`
  }

  const head = '@ECHO off\r\n' +
    'GOTO start\r\n' +
    ':find_dp0\r\n' +
    'SET dp0=%~dp0\r\n' +
    'EXIT /b\r\n' +
    ':start\r\n' +
    'SETLOCAL\r\n' +
    'CALL :find_dp0\r\n'

  let cmd
  if (longProg) {
    args = args.trim()
    cmd = head +
      convertToSetCommands(variables) +
      '\r\n' +
      `IF EXIST ${longProg} (\r\n` +
      `  SET "_prog=${longProg.replace(/(^")|("$)/g, '')}"\r\n` +
      ') ELSE (\r\n' +
      `  SET "_prog=${prog.replace(/(^")|("$)/g, '')}"\r\n` +
      ')\r\n' +
      '\r\n' +
      'endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & ' +
      `set PATHEXT=%PATHEXT:;.JS;=;% & "%_prog%" ${args} ${target} %*\r\n`
  } else {
    cmd = `${head}${prog} ${args} ${target} %*\r\n`
  }

  let sh = '#!/bin/sh\n' +
    'basedir=$(dirname "$(echo "$0" | sed -e \'s,\\\\,/,g\')")\n' +
    'basedir_win="$basedir"\n' +
    '\n' +
    'case `uname -a` in\n' +
    '  *CYGWIN*|*MINGW*|*MSYS*)\n' +
    '    if command -v cygpath > /dev/null 2>&1; then\n' +
    '      basedir_win=`cygpath -w "$basedir"`\n' +
    '    fi\n' +
    '  ;;\n' +
    '  *WSL2*)\n' +
    '    if command -v wslpath > /dev/null 2>&1; then\n' +
    '      basedir_win="$(wslpath -w "$basedir" 2> /dev/null)"\n' +
    '      if [ $? -ne 0 ] || [ -z "$basedir_win" ]; then\n' +
    '        echo "Error: wslpath failed to convert path. WSL environment may be misconfigured." >&2\n' +
    '        exit 1\n' +
    '      fi\n' +
    '    fi\n' +
    '  ;;\n' +
    'esac\n' +
    '\n'

  if (shLongProg) {
    sh = sh +
      `PROG_EXE=${shLongProg.replace(/"$/, '.exe"')}\n` +
      'if ! [ -x "$PROG_EXE" ]; then\n' +
      `  PROG_EXE=${shLongProg}\n` +
      '  if ! [ -x "$PROG_EXE" ]; then\n' +
      `    PROG_EXE=${shProg}\n` +
      '    if ! [ -x "$PROG_EXE" ]; then\n' +
      `      PROG_EXE=${shProg}.exe\n` +
      '    fi\n' +
      '  fi\n' +
      'fi\n' +
      '\n' +
      `exec ${variables}"$PROG_EXE" ${args} ${shTarget} "$@"\n`
  } else {
    sh = sh + `exec ${shProg} ${args} ${shTarget} "$@"\n`
  }

  let pwsh = '#!/usr/bin/env pwsh\n' +
    '$basedir=Split-Path $MyInvocation.MyCommand.Definition -Parent\n' +
    '\n' +
    '$exe=""\n' +
    'if ($PSVersionTable.PSVersion -lt "6.0" -or $IsWindows) {\n' +
    '  # Fix case when both the Windows and Linux builds of Node\n' +
    '  # are installed in the same directory\n' +
    '  $exe=".exe"\n' +
    '}\n'
  if (pwshLongProg) {
    pwsh = pwsh +
      '$ret=0\n' +
      `if (Test-Path ${pwshLongProg}) {\n` +
      '  # Support pipeline input\n' +
      '  if ($MyInvocation.ExpectingInput) {\n' +
      `    $input | & ${pwshLongProg} ${args} ${pwshTarget} $args\n` +
      '  } else {\n' +
      `    & ${pwshLongProg} ${args} ${pwshTarget} $args\n` +
      '  }\n' +
      '  $ret=$LASTEXITCODE\n' +
      '} else {\n' +
      '  # Support pipeline input\n' +
      '  if ($MyInvocation.ExpectingInput) {\n' +
      `    $input | & ${pwshProg} ${args} ${pwshTarget} $args\n` +
      '  } else {\n' +
      `    & ${pwshProg} ${args} ${pwshTarget} $args\n` +
      '  }\n' +
      '  $ret=$LASTEXITCODE\n' +
      '}\n' +
      'exit $ret\n'
  } else {
    pwsh = pwsh +
      '# Support pipeline input\n' +
      'if ($MyInvocation.ExpectingInput) {\n' +
      `  $input | & ${pwshProg} ${args} ${pwshTarget} $args\n` +
      '} else {\n' +
      `  & ${pwshProg} ${args} ${pwshTarget} $args\n` +
      '}\n' +
      'exit $LASTEXITCODE\n'
  }

  return Promise.all([
    writeFile(to + '.ps1', pwsh, 'utf8'),
    writeFile(to + '.cmd', cmd, 'utf8'),
    writeFile(to, sh, 'utf8')
  ]).then(() => Promise.all([
    chmod(to, 0o755),
    chmod(to + '.cmd', 0o755),
    chmod(to + '.ps1', 0o755)
  ]))
}

const prepare = (from, to) =>
  mkdir(dirname(to), { recursive: true })
    .then(() => readFile(from, 'utf8'))
    .then((data) => {
      const firstLine = data.trim().split(/\r*\n/)[0]
      const shebang = firstLine.match(shebangExpr)
      if (!shebang) return writeShim(from, to)
      return writeShim(from, to, shebang[2], shebang[3] || '', shebang[1] || '')
    }, () => writeShim(from, to))

const cmdShim = (from, to) =>
  stat(from).then(() => Promise.all([
    rm(to),
    rm(to + '.cmd'),
    rm(to + '.ps1')
  ])).then(() => prepare(from, to))

export default cmdShim
