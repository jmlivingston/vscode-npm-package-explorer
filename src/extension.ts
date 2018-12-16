'use strict'

import * as vscode from 'vscode'

import { DepNodeProvider, Dependency } from './nodeDependencies'
import { JsonOutlineProvider } from './jsonOutline'
import { FtpExplorer } from './ftpExplorer'
import { FileExplorer } from './fileExplorer'
import { TestView } from './testView'

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

  const jsonOutlineProvider = new JsonOutlineProvider(context)
  vscode.window.registerTreeDataProvider('jsonOutline', jsonOutlineProvider)
  vscode.commands.registerCommand('jsonOutline.refresh', () => jsonOutlineProvider.refresh())
  vscode.commands.registerCommand('jsonOutline.refreshNode', offset =>
    jsonOutlineProvider.refresh(offset)
  )
  vscode.commands.registerCommand('jsonOutline.renameNode', offset =>
    jsonOutlineProvider.rename(offset)
  )
  vscode.commands.registerCommand('extension.openJsonSelection', range =>
    jsonOutlineProvider.select(range)
  )

  // Samples of `window.createView`
  new FtpExplorer(context)
  new FileExplorer(context)

  // Test View
  new TestView(context)
}
