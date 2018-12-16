import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export class DepNodeProvider implements vscode.TreeDataProvider<Dependency> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    Dependency | undefined
  > = new vscode.EventEmitter<Dependency | undefined>()
  readonly onDidChangeTreeData: vscode.Event<Dependency | undefined> = this._onDidChangeTreeData
    .event

  constructor(private workspaceRoot: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: Dependency): vscode.TreeItem {
    return element
  }

  getChildren(element?: Dependency): Thenable<Dependency[]> {
    console.log(element)
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace')
      return Promise.resolve([])
    }

    if (element) {
      return Promise.resolve(this.getDepsInPackageJson(element.folderPath))
    } else {
      const packageJsonPath = path.join(this.workspaceRoot, 'package.json')
      if (this.pathExists(packageJsonPath)) {
        return Promise.resolve(this.getDepsInPackageJson(packageJsonPath))
      } else {
        vscode.window.showInformationMessage('Workspace has no package.json')
        return Promise.resolve([])
      }
    }
  }

  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  private getDepsInPackageJson(packageJsonBasePath: string): Dependency[] {
    let packageJsonPaths = [packageJsonBasePath]
    const packageJson = JSON.parse(fs.readFileSync(packageJsonBasePath, 'utf-8'))
    const isDirectory = source => fs.lstatSync(source).isDirectory()
    const getDirectories = source =>
      fs
        .readdirSync(source)
        .map(name => path.join(source, name))
        .filter(isDirectory)
        .map(name => path.join(name, 'package.json'))
    if (packageJson.workspaces) {
      for (let workspace of packageJson.workspaces) {
        if (workspace.includes('*')) {
          const workspaceDirectories = getDirectories(
            path.join(packageJsonBasePath.replace('package.json', ''), workspace.replace('*', ''))
          )
          packageJsonPaths = [...packageJsonPaths, ...workspaceDirectories]
        } else {
          packageJsonPaths.push(path.join(packageJsonBasePath, workspace))
        }
      }
    }
    const dependencies = packageJsonPaths.reduce((acc, packageJsonPath) => {
      if (this.pathExists(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
        const toDep = (moduleName: string, version: string): Dependency => {
          const workspaceNodeModulesPath = path.join(
            packageJsonPath.replace('package.json', ''),
            'node_modules',
            moduleName,
            'package.json'
          )
          const rootNodeModulesPath = path.join(
            this.workspaceRoot,
            'node_modules',
            moduleName,
            'package.json'
          )
          if (this.pathExists(workspaceNodeModulesPath)) {
            return new Dependency(
              moduleName,
              version,
              workspaceNodeModulesPath,
              vscode.TreeItemCollapsibleState.Collapsed
            )
          } else if (this.pathExists(rootNodeModulesPath)) {
            return new Dependency(
              moduleName,
              version,
              rootNodeModulesPath,
              vscode.TreeItemCollapsibleState.Collapsed
            )
          } else {
            // Do nothing
            const openNpmConfig = {
              command: 'extension.openPackageOnNpm',
              title: '',
              arguments: [moduleName]
            }
            const openNpm = false
            return new Dependency(
              moduleName,
              version,
              packageJsonPath,
              vscode.TreeItemCollapsibleState.None,
              openNpm ? openNpmConfig : undefined
            )
          }
        }
        const deps = packageJson.dependencies
          ? Object.keys(packageJson.dependencies).map(dep =>
              toDep(dep, packageJson.dependencies[dep])
            )
          : []
        const devDeps = packageJson.devDependencies
          ? Object.keys(packageJson.devDependencies).map(dep =>
              toDep(dep, packageJson.devDependencies[dep])
            )
          : []
        return [...acc, ...deps.concat(devDeps)]
      } else {
        return acc
      }
    }, [])
    return dependencies
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p)
    } catch (err) {
      return false
    }

    return true
  }
}

export class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly folderPath: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState)
  }

  get tooltip(): string {
    return `${this.label}-${this.version}`
  }

  get description(): string {
    return this.version
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
  }

  contextValue = 'dependency'
}
