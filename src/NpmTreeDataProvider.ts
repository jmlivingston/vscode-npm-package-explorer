import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import NpmTreeItem from "./NpmTreeItem";

export default class NpmTreeDataProvider implements vscode.TreeDataProvider<NpmTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<NpmTreeItem | undefined> = new vscode.EventEmitter<
    NpmTreeItem | undefined
  >();

  readonly onDidChangeTreeData: vscode.Event<NpmTreeItem | undefined> = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: NpmTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: NpmTreeItem): Thenable<NpmTreeItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage("No dependency in empty workspace");
      return Promise.resolve([]);
    }
    if (element) {
      return Promise.resolve(this.getDepsInPackageJson(element.folderPath));
    } else {
      const packageJsonPath = path.join(this.workspaceRoot, "package.json");
      if (this.pathExists(packageJsonPath)) {
        return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
      } else {
        vscode.window.showInformationMessage("Workspace has no package.json");
        return Promise.resolve([]);
      }
    }
  }

  isDirectory(source) {
    return fs.lstatSync(source).isDirectory();
  }

  getPackageJsonDirectories(source) {
    return fs
      .readdirSync(source)
      .map(name => path.join(source, name))
      .filter(this.isDirectory)
      .map(name => path.join(name, "package.json"));
  }

  pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }
    return true;
  }

  private getDepsInPackageJson(packageJsonBasePath: string): NpmTreeItem[] {
    let packageJsonPaths = [packageJsonBasePath];
    const packageJson = JSON.parse(fs.readFileSync(packageJsonBasePath, "utf-8"));
    if (packageJson.workspaces) {
      for (let workspace of packageJson.workspaces) {
        if (workspace.includes("*")) {
          const workspaceDirectories = this.getPackageJsonDirectories(
            path.join(packageJsonBasePath.replace("package.json", ""), workspace.replace("*", ""))
          );
          packageJsonPaths = [...packageJsonPaths, ...workspaceDirectories];
        } else {
          packageJsonPaths.push(path.join(packageJsonBasePath, workspace));
        }
      }
    }
    const dependencies = packageJsonPaths.reduce((acc, packageJsonPath) => {
      if (this.pathExists(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        const toDep = (moduleName: string, version: string): NpmTreeItem => {
          const workspaceNodeModulesPath = path.join(
            packageJsonPath.replace("package.json", ""),
            "node_modules",
            moduleName,
            "package.json"
          );
          const rootNodeModulesPath = path.join(this.workspaceRoot, "node_modules", moduleName, "package.json");
          if (this.pathExists(workspaceNodeModulesPath)) {
            return new NpmTreeItem(
              moduleName,
              version,
              workspaceNodeModulesPath,
              vscode.TreeItemCollapsibleState.Collapsed
            );
          } else if (this.pathExists(rootNodeModulesPath)) {
            return new NpmTreeItem(moduleName, version, rootNodeModulesPath, vscode.TreeItemCollapsibleState.Collapsed);
          } else {
            // Do nothing
            const openNpmConfig = {
              command: "extension.openPackageOnNpm",
              title: "",
              arguments: [moduleName]
            };
            const openNpm = false;
            return new NpmTreeItem(
              moduleName,
              version,
              packageJsonPath,
              vscode.TreeItemCollapsibleState.None,
              openNpm ? openNpmConfig : undefined
            );
          }
        };
        const deps = packageJson.dependencies
          ? Object.keys(packageJson.dependencies).map(dep => toDep(dep, packageJson.dependencies[dep]))
          : [];
        const devDeps = packageJson.devDependencies
          ? Object.keys(packageJson.devDependencies).map(dep => toDep(dep, packageJson.devDependencies[dep]))
          : [];
        return [...acc, ...deps.concat(devDeps)];
      } else {
        return acc;
      }
    }, []);
    return dependencies;
  }
}
