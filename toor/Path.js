import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

// 路径管理
class Path {
  constructor() {
    this.initPaths()
  }
  initPaths() {
    try {
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = path.dirname(__filename)
      
      this.pluginRoot = path.join(__dirname, '../')
      
      this.configDir = path.join(this.pluginRoot, 'config')
      
      this.pluginResources = path.join(this.pluginRoot, 'resources')
      this.logsDir = path.join(this.pluginRoot, 'logs')
      
      this.configFiles = {
        main: path.join(this.configDir, '1插件.yml'),
        groups: path.join(this.configDir, '2群组.yaml'),
        servers: path.join(this.configDir, '3服务器.yml'),
        bannedWords: path.join(this.configDir, '4违禁词.yml'),
        sample: path.join(this.configDir, '配置样本.yaml')
      }
      
    } catch (error) {
      console.error('[Path] 路径初始化失败:', error)
      throw error
    }
  }

  getPluginRoot() {
    return this.pluginRoot
  }

  getConfigDir() {
    return this.configDir
  }

  getConfigFilePath(filenameKey) {
    const filePath = this.configFiles[filenameKey]
    if (!filePath) {
      throw new Error(`未知的配置文件键: ${filenameKey}`)
    }
    return filePath
  }

  ensureDirectoryExists(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
        console.log(`[Path] 创建目录: ${dirPath}`)
        return true
      }
      return true
    } catch (error) {
      console.error(`[Path] 创建目录失败 ${dirPath}:`, error)
      return false
    }
  }

  ensureAllDirectories() {
    const directories = [
      this.pluginRoot,
      this.configDir,
      this.pluginResources,
      this.logsDir
    ]
    
    return directories.every(dir => this.ensureDirectoryExists(dir))
  }

  getPackageInfo() {
    try {
      const packagePath = path.join(this.pluginRoot, 'package.json')
      if (!fs.existsSync(packagePath)) {
        return { version: '未知版本' }
      }
      
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
      return {
        version: packageData.version || '未知版本',
        name: packageData.name || 'mc-plugin'
      }
    } catch (error) {
      console.error('[Path] 读取package.json失败:', error)
      return { version: '未知版本', name: 'mc-plugin' }
    }
  }
}

// 导出单例实例
export default new Path()