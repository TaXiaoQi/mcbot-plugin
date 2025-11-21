import Config from './toor/Config.js'
import WebSocket from './apps/WebSocket.js'
import Message from './apps/Message.js'
import RconConnectList from './apps/Rcon.js'
import Option from './apps/Option.js'

if (!global.segment) {
  global.segment = (await import('oicq')).segment
}

class MCBotPlugin {
  constructor() {
    this.initialized = false
    this.messageHandler = null
  }

  async init() {
    try {
      logger.info('---------------')
      logger.mark(logger.green('MC-Bot 独立插件启动'))

      // 1. 初始化配置
      const configResult = Config.initConfig()
      if (!configResult) {
        logger.error('[MCBot] 配置初始化失败')
        return false
      }

      // 2. 设置消息处理器
      this.setupMessageHandler()

      // 3. 启动 WebSocket
      const wsResult = await this.initWebSocket()
      if (!wsResult) {
        logger.error('[MCBot] WebSocket初始化失败')
        return false
      }

      // 4. 注册消息事件
      this.registerMessageEvent()

      this.initialized = true
      logger.mark(logger.green('MC-Bot 独立插件初始化完成'))
      logger.info('---------------')
      
      return true

    } catch (error) {
      logger.error('[MCBot] 插件初始化异常', error)
      return false
    }
  }

  setupMessageHandler() {
    this.messageHandler = (type, data) => {
      if (Message && Message.handleWebSocketMessage) {
        Message.handleWebSocketMessage(type, data)
      }
    }
    
    WebSocket.setMessageHandler(this.messageHandler)
  }

  async initWebSocket() {
    try {
      const config = Config.getConfig()
      
      if (!config || !config.插件端口 || !config.插件网址) {
        logger.error('[MCBot] WebSocket配置不完整')
        return false
      }

      const wsResult = await WebSocket.startWebSocket()
      if (!wsResult) {
        logger.error('[MCBot] WebSocket服务器启动失败')
        return false
      }
      return true

    } catch (error) {
      logger.error('[MCBot] WebSocket初始化异常', error)
      return false
    }
  }

  registerMessageEvent() {
    // 注册消息事件处理器
    Bot.on('message', async (e) => {
      await this.handleMessage(e)
    })
  }

  async handleMessage(e) {
    try {
      if (await Option.handleCommand(e)) {
        return false;
      }
      const result = await Message.message(e);
      return result;
    } catch (error) {
      logger.error('[MCBot] 消息处理异常', error);
      return false;
    }
  }

  // 插件状态查询
  getStatus() {
    const config = Config.getConfig()
    const wsConnections = WebSocket.getActiveServers()
    const rconStats = RconConnectList.getConnectionStats()

    return {
      initialized: this.initialized,
      config: {
        serverCount: config.服务器配置?.length || 0,
        groupCount: config.群组配置?.length || 0,
        wsPort: config.插件端口,
        wsUrl: config.插件网址
      },
      connections: {
        ws: wsConnections.length,
        rcon: rconStats
      }
    }
  }

  // 重载插件
  async reload() {
    try {
      logger.info('[MCBot] 开始重新加载插件')
      
      Config.clearCache()
      
      this.initialized = false
      const result = await this.init()
      
      return result

    } catch (error) {
      logger.error('[MCBot] 插件重新加载异常', error)
      return false
    }
  }
}

// 创建插件实例并初始化
const mcBotPlugin = new MCBotPlugin()

// 立即初始化
await mcBotPlugin.init()

// 导出插件实例
export default mcBotPlugin