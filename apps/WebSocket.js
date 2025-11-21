import { WebSocketServer } from 'ws';
import Config from '../toor/Config.js';
import Log from '../toor/logs.js';
import RconConnectList from './Rcon.js';

class WebSocket {
  activeServers = [];
  messageHandler = null;
  wsServer = null;
  

  setMessageHandler(handler) {
    this.messageHandler = handler;
  }

  async startWebSocket() {
    try {
      if (this.wsServer) {
        await this.stopWebSocket();
      }

      const config = Config.getConfig(true);
      
      if (!config || !config.插件端口 || !config.插件网址) {
        Log.e('[MC_QQ]丨配置读取失败或配置不完整');
        return false;
      }

      this.wsServer = new WebSocketServer({
        port: config.插件端口,
        path: config.插件网址,
      });

      this.wsServer.on('connection', (ws, request) => {
        let serverName = request.headers['x-self-name'];
        serverName = this.normalizeServerName(serverName);
        ws.serverName = serverName;
        this.activeServers.push({ name: serverName, socket: ws });
        Log.i(`【MC】[${serverName}] 已连接`);

        RconConnectList.getRconConnection(serverName).then(async rcon => {
          if (rcon) {
            const connected = await rcon.RconCreate();
            if (connected) {
              Log.i(`[MC_QQ]丨服务器[${serverName}] RCON连接成功`);
            } else {
              Log.w(`[MC_QQ]丨服务器[${serverName}] RCON连接失败`);
            }
          } else {
            Log.w(`[MC_QQ]丨RCON连接创建失败: ${serverName}`);
          }
        });
        
        if (this.messageHandler) {
          this.messageHandler('server_online', { serverName });
        }
        
        this.wsHandler(ws);
      });
      return true;
    } catch (error) {
      Log.e('[MC_QQ]丨WS启动失败:', error);
      return false;
    }
  }

  async stopWebSocket() {
    try {
      if (this.wsServer) {
        // 关闭所有活跃连接
        this.activeServers.forEach(server => {
          try {
            if (server.socket && server.socket.readyState !== WebSocket.CLOSED) {
              server.socket.close();
            }
          } catch (error) {
            Log.e(`[WebSocket] 关闭连接失败 ${server.name}:`, error);
          }
        });
        this.activeServers = [];

        this.wsServer.close();
        this.wsServer = null;
      }
      return true;
    } catch (error) {
      Log.e('[MC_QQ]丨WebSocket停止失败:', error);
      return false;
    }
  }

  getConnectionCount() {
    return this.activeServers.length;
  }

  async safeRestartWebSocketServer() {
    try {
      await this.stopWebSocket();
      await this.startWebSocket();
      return true;
    } catch (error) {
      Log.e('[WebSocket] WebSocket重启失败:', error);
      return false;
    }
  }

  async updateWebSocketConnections(changes) {
    const results = {
      restarted: false,
      newConnections: [],
      closedConnections: []
    };
    
    if (changes.wsConfig) {
      Log.i('[MC_QQ]丨WS基础配置变更，重启WebSocket服务器');
      await this.safeRestartWebSocketServer();
      results.restarted = true;
      return results;
    }
    
    if (changes.servers) {
      for (const serverName of changes.servers.removed) {
        await this.closeServerConnection(serverName);
        results.closedConnections.push(serverName);
      }
      results.newConnections = changes.servers.added;
    }
    
    return results;
  }

  // 关闭指定服务器的连接
  async closeServerConnection(serverName) {
    const normalizedName = this.normalizeServerName(serverName);
    
    const serverIndex = this.activeServers.findIndex(server => {
      const serverNormalizedName = this.normalizeServerName(server.name);
      return serverNormalizedName === normalizedName || server.name === normalizedName;
    });
    
    const [removedServer] = this.activeServers.splice(serverIndex, 1);
    try {
      if (removedServer.socket && removedServer.socket.readyState !== WebSocket.CLOSED) {
        removedServer.socket.close();
      }
    } catch (error) {
      Log.e(`[MC_QQ]丨关闭服务器连接失败 ${normalizedName}:`, error);
    }
    
    try {
      RconConnectList.removeRconConnection(normalizedName);
    } catch (error) {
      Log.e(`[MC_QQ]丨移除RCON连接失败 ${normalizedName}:`, error);
    }
    
    if (this.messageHandler) {
      try {
        this.messageHandler('server_offline', { serverName: normalizedName });
      } catch (error) {
        Log.e(`[MC_QQ]丨通知服务器下线失败 ${normalizedName}:`, error);
      }
    }
  }

  // 转码服务器名称
  normalizeServerName(rawName) {
    if (!rawName) {
      Log.w(`[MC_QQ]丨服务器名称为空，使用默认名称`);
      return '未知服务器';
    }
    
    let normalizedName = rawName;
    
    try {
      normalizedName = normalizedName.replace(/^["'\s]+|["'\s]+$/g, '');
      
      const isUnicodeEscaped = normalizedName.includes('\\u') && 
                              /\\u[0-9A-Fa-f]{4}/.test(normalizedName);
      if (isUnicodeEscaped) {
        const decodedName = this.decodeUnicode(normalizedName);
        normalizedName = decodedName;
      }
      else if (normalizedName.includes('%') && 
               /%[0-9A-Fa-f]{2}/.test(normalizedName)) {
        const decodedName = decodeURIComponent(normalizedName);
        normalizedName = decodedName;
      } 
      normalizedName = normalizedName.trim();
      if (!normalizedName) {
        normalizedName = '未命名服务器';
      }
      
    } catch (error) {
      Log.e(`[MC_QQ]丨服务器名称处理失败:`, rawName, error);
      normalizedName = rawName.replace(/^["'\s]+|["'\s]+$/g, '') || '处理失败服务器';
    }
    return normalizedName;
  }

  // 解码服务器名称
  decodeUnicode(str) {
    try {
      return str.replace(/\\u([0-9A-Fa-f]{4})/g, (match, code) => {
        return String.fromCharCode(parseInt(code, 16));
      });
    } catch (error) {
      Log.e(`[MC_QQ]丨Unicode解码失败:`, str, error);
      return str;
    }
  }

  // WebSocket
  wsHandler(ws) {
    ws.on('message', (message) => {
      try {
        
        let event;
        if (message instanceof Buffer) {
          const decodedMessage = message.toString('utf8');
          event = JSON.parse(decodedMessage);
        } else {
          event = JSON.parse(message);
        }
        // 优化成就事件过滤逻辑
        if (event.post_type === 'notice' && event.sub_type === 'achievement') {
          const advancement = event.advancement;
          
          // 过滤无效的成就事件
          if (!advancement || 
              (!advancement.text && 
               (!advancement.display || !advancement.display.title))) {
            Log.i(`[WebSocket] 忽略无效成就事件，玩家: ${event.player?.nickname || '未知'}`);
            return;
          }
        // 过滤重复的配方解锁成就（通常没有显示内容）
        if (advancement.criteria && 
          advancement.criteria.includes('has_the_recipe') &&
          (!advancement.display || !advancement.display.title)) {
        Log.i(`[WebSocket] 忽略配方解锁成就，玩家: ${event.player?.nickname || '未知'}`);
        return;
      }
    }

        Log.i(`[WebSocket] 收到事件: ${event.post_type}.${event.sub_type} from ${event.server_name}`);
        Log.i(`[WebSocket] 玩家: ${event.player?.nickname || '无玩家'}, 消息: ${event.message || '无消息'}`);
        Log.i(`[WebSocket] 完整数据: ${JSON.stringify(event)}`);

        const serverName = this.normalizeServerName(event.server_name);
        event.server_name = serverName;
        
        if (this.messageHandler) {
          this.messageHandler('minecraft_event', event);
        }
      } catch (error) {
        console.log('❌ WebSocket消息处理错误:', error);
        console.log('导致错误的消息内容:', message);
        Log.e('[WebSocket] 消息处理失败:', error);
      }
    });
    

    ws.on('close', () => {
      let closedServerName = ws.serverName;
      
      closedServerName = this.normalizeServerName(closedServerName);
      
      this.activeServers = this.activeServers.filter(server => {
        const serverNormalizedName = this.normalizeServerName(server.name);
        return serverNormalizedName !== closedServerName && server.name !== closedServerName;
      });

      if (this.messageHandler) {
        try {
          this.messageHandler('server_offline', { serverName: closedServerName });
        } catch (error) {
          Log.e(`[MC_QQ]丨通知服务器下线失败 ${closedServerName}:`, error);
        }
      }
    });
    ws.on('error', (error) => {
      Log.e(`[MC_QQ]丨WS通信异常:`, error);
    });
  }

  // 获取所有活跃的服务器
  getActiveServers() {
    return this.activeServers;
  }

  // 检查WS
  isRunning() {
    return this.wsServer !== null;
  }
}

// 导出单例实例
export default new WebSocket();