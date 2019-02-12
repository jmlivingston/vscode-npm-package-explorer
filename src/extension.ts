"use strict";

import * as vscode from "vscode";
import NpmTreeDataProvider from "./NpmTreeDataProvider";
import NpmTreeItem from "./NpmTreeItem";

export function activate(context: vscode.ExtensionContext) {
  const nodeDependenciesProvider = new NpmTreeDataProvider(vscode.workspace.rootPath);
  vscode.window.registerTreeDataProvider("nodeDependencies", nodeDependenciesProvider);
  vscode.commands.registerCommand("nodeDependencies.openPackageOnNpm", (node: NpmTreeItem) =>
    vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(`https://www.npmjs.com/package/${node.label}`))
  );
  vscode.commands.registerCommand("nodeDependencies.openInNodeModules", (node: NpmTreeItem) => {
    vscode.workspace.openTextDocument(node.folderPath).then(doc => {
      vscode.commands.executeCommand("workbench.view.explorer");
      vscode.window.showTextDocument(doc);
    });
  });
}
