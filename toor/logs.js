import Path from './Path.js'  

let currentVersion

try {
  const packageInfo = Path.getPackageInfo()
  currentVersion = packageInfo.version
} catch (err) {
  console.log('读取版本信息失败', err)
}

/**
 * 自定义日志类
 */
class Log {
  constructor() {
    this.header = `【Mc-Plug v${currentVersion || '未知版本'}】`
  }

  i(...msg) {
    logger.info(this.header, ...msg)
  }

  m(...msg) {
    logger.mark(this.header, ...msg)
  }

  w(...msg) {
    logger.warn(this.header, ...msg)
  }

  e(...msg) {
    logger.error(this.header, ...msg)
  }

  c(...msg) {
    console.log(this.header, ...msg)
  }
}

export default new Log()