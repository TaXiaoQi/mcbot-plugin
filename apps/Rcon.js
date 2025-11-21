import Rcon from 'rcon';                  // RCON
import Config from '../toor/Config.js';   // 配置
import Log from '../toor/logs.js';        // 日志
import Turn from '../toor/Turn.js'        // 翻译

class RconConnect {
    constructor(serverName, host, port, password, prefix, commandList) { 
        this.serverName = serverName;
        this.host = host;
        this.port = Number(port);
        this.password = String(password);
        this.前缀 = prefix || '#'; 
        this.commandList = commandList || [];
        this.RconClient = null;
        this.isConnecting = false;
    }
   

    async sendCommand(e, command, isCommand) {
        if (!this.RconClient || !this.RconClient._authenticated) {
          const connected = await this.RconCreate();
          if (!connected) {
            e.reply(`[QQ_MC]丨服务器[${this.serverName}]连接失败`);
            return false;
          }
        }
    
        try {
          this.RconClient.send(command);
          this.RconClient.removeAllListeners('response');
          if (isCommand) {
            return new Promise((resolve) => {
              this.RconClient.on('response', str => {
                const translatedResponse = Turn.translate(str, 'command');
                if (e && e.reply) {
                  e.reply(translatedResponse, true);
                }
                resolve(true);
              });
            });
          } else {
            return true;
          }
        } catch (error) {
          e.reply(`[QQ_MC]丨服务器[${this.serverName}]Rcon发送失败，请检查控制台输出`);
          Log.e(error);
          return false;
        }
      }

    async RconCreate() {
        if (this.isConnecting) {
            return false;
        }
    
        this.isConnecting = true;
    
        try {
            this.RconClient = new Rcon(
                this.host,
                this.port,
                this.password
            );
            return new Promise((resolve) => {
                let connected = false;
                let timeoutId;
                this.RconClient.on('auth', () => {
                    connected = true;
                    this.isConnecting = false;
                    if (timeoutId) clearTimeout(timeoutId);
                    resolve(true);
                });
                this.RconClient.on('error', (error) => {
                    Log.e(`[QQ_MC]丨服务器[${this.serverName}]Rcon连接错误:`, error);
                    this.isConnecting = false;
                    this.RconClient = null;
                    if (timeoutId) clearTimeout(timeoutId);
                    resolve(false);
                });
                this.RconClient.connect();
                timeoutId = setTimeout(() => {
                    if (!connected) {
                        Log.e(`[QQ_MC]丨服务器[${this.serverName}]Rcon连接超时`);
                        this.isConnecting = false;
                        this.RconClient = null;
                        resolve(false);
                    }
                }, 10000);
            });
    
        } catch (error) {
            Log.e(`[QQ_MC]丨服务器[${this.serverName}]Rcon连接异常:`, error);
            this.isConnecting = false;
            this.RconClient = null;
            return false;
        }
    }

    disconnect() {
        if (this.RconClient) {
            try {
                this.RconClient.disconnect();
                Log.i(`[QQ_MC]丨服务器[${this.serverName}]Rcon连接已断开`);
            } catch (error) {
                Log.e(`[QQ_MC]丨服务器[${this.serverName}]Rcon断开连接错误:`, error);
            }
            this.RconClient = null;
        }
        this.isConnecting = false;
    }

    updateConfig(host, port, password, header, commandList) {
        const configChanged = this.host !== host || 
                            this.port !== Number(port) || 
                            this.password !== String(password) || 
                            this.前缀 !== header ||
                            JSON.stringify(this.commandList) !== JSON.stringify(commandList || []);

        if (configChanged) {
            Log.i(`[Rcon] 服务器[${this.serverName}]配置已变更，更新连接`);
            this.host = host;
            this.port = Number(port);
            this.password = String(password);
            this.前缀 = header;
            this.commandList = commandList || [];
            
            this.disconnect();
            return true;
        }
        return false;
    }

    isCommandAllowed(command) {
        if (!this.commandList || this.commandList.length === 0) {
            return false;
        }
        
        const trimmedCommand = command.trim().toLowerCase();
        return this.commandList.some(allowedCmd => 
            trimmedCommand.startsWith(allowedCmd.toLowerCase())
        );
    }
}

class RconConnectList {
    constructor() {
        this.RconServerList = {};
    }

    async getRconConnection(serverName) {
        
        const config = Config.getConfig();
        if (!config) {
          Log.e('[RCON] 配置读取失败');
          return null;
        }
        
        if (!config.服务器配置 || !Array.isArray(config.服务器配置)) {
          Log.e('[RCON] 服务器配置不存在或格式错误');
          return null;
        }
        
        const serverConfig = config.服务器配置.find(s => s.服务器名称 === serverName);
        if (!serverConfig) {
          return null;
        }
        
        if (!serverConfig.rcon网址 || !serverConfig.rcon端口 || !serverConfig.rcon密码) {
          Log.e(`[RCON] 服务器 ${serverName} 的RCON配置不完整`);
          return null;
        }
        
        console.log(`[RCON调试] 服务器 ${serverName} 的配置前缀: "${serverConfig.前缀}"`);
        const prefix = serverConfig.前缀 || "#";
        if (!serverConfig.前缀) {
          Log.w(`[RCON] 服务器 ${serverName} 的前缀未设置，使用默认值: "${prefix}"`);
        }

        if (serverConfig.服务器名称 === 'default_server') {
          return null;
        }
        
        if (this.RconServerList[serverName]) {
          const existingConnection = this.RconServerList[serverName];
          Log.i(`[RCON] 现有连接前缀: "${existingConnection.header}", 新配置前缀: "${prefix}"`);
          
          if (existingConnection.header !== prefix ||
              existingConnection.host !== serverConfig.rcon网址 ||
              existingConnection.port !== Number(serverConfig.rcon端口) ||
              existingConnection.password !== String(serverConfig.rcon密码)) {
            
            Log.i(`[RCON] 配置有变化，重新创建连接`);
            existingConnection.disconnect();
            delete this.RconServerList[serverName];
          } else {
            Log.i(`[RCON] 配置一致，使用现有连接`);
            return this.RconServerList[serverName];
          }
        }
        
        const rconConnection = new RconConnect(
          serverConfig.服务器名称,    
          serverConfig.rcon网址,     
          Number(serverConfig.rcon端口),
          String(serverConfig.rcon密码),
          prefix, 
          serverConfig.指令列表 || []
        );
        this.RconServerList[serverName] = rconConnection;
        return rconConnection;
      }
    
    // 更新RCON配置
    updateAllConnections() {
      const config = Config.getConfig();
      
      for (let serverName in this.RconServerList) {
        this.RconServerList[serverName].disconnect();
        delete this.RconServerList[serverName];
      }
    }

    // 更新RCON连接
    async updateRconConnections(changes) {
        const results = {
            updated: [],
            removed: [],
            added: [],
            errors: []
        };
        
        if (!changes.servers) {
            return results;
        }

        const config = Config.getConfig();
        
        for (const serverName of changes.servers.removed) {
            this.removeRconConnection(serverName);
            results.removed.push(serverName);
            Log.i(`[Rcon] 已移除服务器连接: ${serverName}`);
        }
        
        for (const serverName of changes.servers.modified) {
            try {
                const serverConfig = config.服务器配置.find(s => s.服务器名称 === serverName);
                if (serverConfig) {
                    const existingConnection = this.RconServerList[serverName];
                    if (existingConnection) {
                        const updated = existingConnection.updateConfig(
                            serverConfig.rcon网址,
                            serverConfig.rcon端口,
                            serverConfig.rcon密码,
                            serverConfig.前缀,
                            serverConfig.指令列表
                        );
                        if (updated) {
                            results.updated.push(serverName);
                            Log.i(`[Rcon] 已更新服务器配置: ${serverName}`);
                        }
                    } else {
                        this.RconServerList[serverName] = new RconConnect(
                            serverConfig.服务器名称,
                            serverConfig.rcon网址,
                            serverConfig.rcon端口,
                            serverConfig.rcon密码,
                            serverConfig.前缀,
                            serverConfig.指令列表
                        );
                        results.updated.push(serverName);
                        Log.i(`[Rcon] 已重新创建服务器连接: ${serverName}`);
                    }
                }
            } catch (error) {
                Log.e(`[Rcon] 更新服务器配置失败: ${serverName}`, error);
                results.errors.push(serverName);
            }
        }
        
        results.added = changes.servers.added;
        Log.i(`[Rcon] 新增服务器将在使用时创建: ${results.added.join(', ')}`);

        return results;
    }

    removeRconConnection(serverName) {
        if (!serverName) {
          Log.w(`[QQ_MC]丨移除RCON连接时服务器名称为空`);
          return;
        }
        
        if (this.RconServerList[serverName]) {
          try {
            this.RconServerList[serverName].disconnect();
            delete this.RconServerList[serverName];
          } catch (error) {
            Log.e(`[QQ_MC]丨移除服务器 [${serverName}] RCON连接时发生错误:`, error);
          }
        } else {
          Log.i(`[QQ_MC]丨服务器 [${serverName}] 的 RCON 连接不存在，无需移除`);
        }
      }

    getAllConnections() {
        return this.RconServerList;
    }

    // 获取连接统计信息
    getConnectionStats() {
        const stats = {
            total: Object.keys(this.RconServerList).length,
            connected: 0,
            connecting: 0,
            disconnected: 0
        };
        
        for (const serverName in this.RconServerList) {
            const connection = this.RconServerList[serverName];
            if (connection.RconClient && connection.RconClient._authenticated) {
                stats.connected++;
            } else if (connection.isConnecting) {
                stats.connecting++;
            } else {
                stats.disconnected++;
            }
        }
        
        return stats;
    }

    // 检查服务器连接状态
    async checkConnectionStatus(serverName) {
        const connection = this.RconServerList[serverName];
        if (!connection) {
            return { status: 'not_exists', serverName };
        }
        
        if (connection.RconClient && connection.RconClient._authenticated) {
            return { status: 'connected', serverName };
        } else if (connection.isConnecting) {
            return { status: 'connecting', serverName };
        } else {
            const connected = await connection.RconCreate();
            return { 
                status: connected ? 'connected' : 'disconnected', 
                serverName 
            };
        }
    }
}

// 导出单例实例
export default new RconConnectList();