'use strict'

import * as vscode from 'vscode'

import { DepNodeProvider, Dependency } from './nodeDependencies'
import { FileExplorer } from './fileExplorer'

export function activate(context: vscode.ExtensionContext) {
  // Samples of `window.registerTreeDataProvider`
  const nodeDependenciesProvider = new DepNodeProvider(vscode.workspace.rootPath)
  vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider)
  vscode.commands.registerCommand('nodeDependencies.refreshEntry', () =>
    nodeDependenciesProvider.refresh()
  )
  vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName =>
    vscode.commands.executeCommand(
      'vscode.open',
      vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)
    )
  )
  vscode.commands.registerCommand('nodeDependencies.addEntry', () =>
    vscode.window.showInformationMessage(`Successfully called add entry.`)
  )
  vscode.commands.registerCommand('nodeDependencies.editEntry', (node: Dependency) =>
    vscode.window.showInformationMessage(
      `Successfully called edit entry on ${JSON.stringify(node)}.`
    )
  )
  vscode.commands.registerCommand('nodeDependencies.openEntryInNpm', (node: Dependency) =>
    vscode.commands.executeCommand(
      'vscode.open',
      vscode.Uri.parse(`https://www.npmjs.com/package/${node.label}`)
    )
  )
  vscode.commands.registerCommand('nodeDependencies.openInNodeModules', (node: Dependency) => {
    // var openPath = vscode.Uri.parse("'file///'" + node.folderPath)
    vscode.workspace.openTextDocument(node.folderPath).then(doc => {
      vscode.window.showTextDocument(doc)
    })
  })

  // Samples of `window.createView`
  new FileExplorer(context)
}
