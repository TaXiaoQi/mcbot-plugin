
import YAML from 'yaml'
import fs from 'fs'
import path from 'path'
import Path from './Path.js'
import Log from './logs.js'

class Cache {
  constructor() {
    this.configDir = Path.getConfigDir()
    this.writeQueue = new Map()
    this.isWriting = false
    this.writeInterval = 30000 // 30秒批量写入
    this.maxQueueSize = 50
    this.pendingWrites = new Set()
    
    this.startBatchWriter()
  }

  // 添加到写入队列
  queueWrite(filename, data) {
    const filePath = path.join(this.configDir, filename)
    this.writeQueue.set(filePath, data)
    this.pendingWrites.add(filePath)
    
    // 如果队列过大，立即写入
    if (this.writeQueue.size >= this.maxQueueSize) {
      this.flushToDisk()
    }
    
    return true
  }

  // 立即写入文件
  immediateWrite(filename, data) {
    const filePath = path.join(this.configDir, filename)
    try {

      this.performWrite(filePath, data)
      Log.i(`[Cache] 立即写入完成: ${filename}`)
      return true
    } catch (error) {
      Log.e(`[Cache] 立即写入失败: ${filename}`, error)
      return false
    }
  }

  // 批量写入磁盘
  async flushToDisk() {
    if (this.isWriting || this.writeQueue.size === 0) return
    
    this.isWriting = true
    try {
      const snapshot = new Map(this.writeQueue)
      this.writeQueue.clear()
      
      let successCount = 0
      let failCount = 0
      
      for (const [filePath, data] of snapshot) {
        try {
          await this.performWrite(filePath, data)
          this.pendingWrites.delete(filePath)
          successCount++
        } catch (error) {
          Log.e(`[Cache] 文件写入失败: ${path.basename(filePath)}`, error)
          failCount++
          // 失败的文件重新加入队列
          this.writeQueue.set(filePath, data)
        }
      }
      
      Log.i(`[Cache] 批量写入完成: 成功 ${successCount} 个, 失败 ${failCount} 个`)
    } catch (error) {
      Log.e('[Cache] 批量写入过程异常:', error)
    } finally {
      this.isWriting = false
    }
  }

  // 执行实际的文件写入
  async performWrite(filePath, data) {
    return new Promise((resolve, reject) => {
      try {
        console.log('[Cache DEBUG] 开始写入文件:', path.basename(filePath));
        console.log('[Cache DEBUG] 写入数据:', JSON.stringify(data, null, 2));
        
        // 确保目录存在
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log('[Cache DEBUG] 创建目录:', dir);
        }
        
        // 写入文件
        const yamlContent = YAML.stringify(data);
        console.log('[Cache DEBUG] YAML内容:', yamlContent);
        
        fs.writeFile(filePath, yamlContent, 'utf8', (err) => {
          if (err) {
            console.error('[Cache DEBUG] 写入失败:', err);
            reject(err);
          } else {
            console.log('[Cache DEBUG] 写入成功:', filePath);
            // 验证文件是否真的写入
            setTimeout(() => {
              if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                console.log('[Cache DEBUG] 文件验证 - 存在, 内容长度:', content.length);
                resolve(true);
              } else {
                console.error('[Cache DEBUG] 文件验证 - 不存在!');
                reject(new Error('文件写入后不存在'));
              }
            }, 100);
          }
        });
      } catch (error) {
        console.error('[Cache DEBUG] 写入过程异常:', error);
        reject(error);
      }
    });
  }

  // 读取文件
  readFile(filename) {
    const filePath = path.join(this.configDir, filename)
    try {
      if (!fs.existsSync(filePath)) {
        return null
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const parsedData = YAML.parse(fileContent)
      return parsedData
    } catch (error) {
      Log.e(`[Cache] 读取文件失败: ${filename}`, error)
      return null
    }
  }

  // 启动批量写入定时器
  startBatchWriter() {
    setInterval(() => this.flushToDisk(), this.writeInterval)
  }

  // 获取写入状态
  getStatus() {
    return {
      queueSize: this.writeQueue.size,
      isWriting: this.isWriting,
      pendingWrites: this.pendingWrites.size
    }
  }

  // 强制立即写入所有队列中的文件
  async forceFlush() {
    Log.i('[Cache] 强制刷新所有待写入文件')
    await this.flushToDisk()
  }
}

export default new Cache()