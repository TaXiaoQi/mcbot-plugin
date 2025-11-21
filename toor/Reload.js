import Config from './Config.js'
import WebSocket from '../apps/WebSocket.js'
import RconConnectList from '../apps/Rcon.js'
import BanNotice from './BanNotice.js'
import Log from './logs.js'

// 重载配置
class Reload {
  constructor() {
    this.isReloading = false;
  }

  async executeHotReload() {
    if (this.isReloading) {
      return {
        success: false,
        error: '正在重载，请稍后',
        skipped: false
      };
    }

    this.isReloading = true;

    try {
      Log.i('[Reload] 开始重载配置');

      const oldConfig = Config.getConfig(false);
      let newConfig;
      try {
        Config.clearCache();
        newConfig = Config.getConfig(true);
        if (!newConfig) {
          throw new Error('配置文件读取失败');
        }
      } catch (error) {
        Log.e('[Reload] 新配置读取失败', error);
        return {
          success: false,
          error: `配置文件读取失败: ${error.message}`,
          config: oldConfig
        };
      }

      const validation = Config.validateConfig(newConfig);
      if (!validation.valid) {
        Log.e('[Reload] 新配置验证失败', validation.errors);
        return {
          success: false,
          error: `配置验证失败: ${validation.errors.join('; ')}`,
          config: oldConfig
        };
      }

      const applyResult = await this.applyNewConfig(newConfig, oldConfig);
      
      if (applyResult.success) {
        Config.forceUpdateCache(newConfig);
        Log.i('[Reload] 重载完成，新配置已生效');
        
        return {
          success: true,
          config: newConfig,
          changes: applyResult.changes,
          message: '配置重载成功'
        };
      } else {
        // 恢复旧配置
        Config.forceUpdateCache(oldConfig);
        Log.w('[Reload] 重载失败，已恢复旧配置');
        
        return {
          success: false,
          error: `配置应用失败: ${applyResult.error}`,
          config: oldConfig
        };
      }

    } catch (error) {
      Log.e('[Reload] 热重载过程异常', error);
      return {
        success: false,
        error: `热重载异常: ${error.message}`,
        config: Config.getConfig()
      };
    } finally {
      this.isReloading = false;
    }
  }

  // 比较变化
  compareConfigChanges(oldConfig, newConfig) {
    const changes = {
      wsConfig: false,
      servers: {
        added: [],
        removed: [],
        modified: []
      },
      groups: {
        added: [],
        removed: [],
        modified: []
      },
      bannedWords: false,
      playerData: false
    };

    if (oldConfig.插件端口 !== newConfig.插件端口 || 
        oldConfig.插件网址 !== newConfig.插件网址 ||
        oldConfig.命令前缀 !== newConfig.命令前缀) {
      changes.wsConfig = true;
    }

    const oldServers = oldConfig.服务器配置 || [];
    const newServers = newConfig.服务器配置 || [];
    
    const oldServerNames = oldServers.map(s => s.服务器名称);
    const newServerNames = newServers.map(s => s.服务器名称);

    changes.servers.added = newServerNames.filter(name => !oldServerNames.includes(name));
    changes.servers.removed = oldServerNames.filter(name => !newServerNames.includes(name));
    changes.servers.modified = newServerNames.filter(name => {
      if (oldServerNames.includes(name)) {
        const oldServer = oldServers.find(s => s.服务器名称 === name);
        const newServer = newServers.find(s => s.服务器名称 === name);
        return JSON.stringify(oldServer) !== JSON.stringify(newServer);
      }
      return false;
    });

    if (JSON.stringify(oldConfig.信息违禁词 || []) !== JSON.stringify(newConfig.信息违禁词 || []) ||
        oldConfig.违禁词替换 !== newConfig.违禁词替换) {
      changes.bannedWords = true;
    }
    if (JSON.stringify(oldConfig.玩家数据 || []) !== JSON.stringify(newConfig.玩家数据 || [])) {
      changes.playerData = true;
    }

    return changes;
  }

  async applyNewConfig(newConfig, oldConfig) {
    try {
      const changes = this.compareConfigChanges(oldConfig, newConfig);
      
      Log.i('[Reload] 检测到配置变化:', changes);

      if (changes.wsConfig) {
        Log.i('[Reload] WebSocket基础配置变更，重启WebSocket服务器');
        const wsResult = await WebSocket.safeRestartWebSocketServer();
        if (!wsResult) {
          return { success: false, error: 'WebSocket 重启失败' };
        }
      } else {
        const wsUpdateResult = await WebSocket.updateWebSocketConnections(changes);
        Log.i('[Reload] WebSocket连接更新结果:', wsUpdateResult);
      }

      const rconUpdateResult = await RconConnectList.updateRconConnections(changes);
      Log.i('[Reload] RCON连接更新结果:', rconUpdateResult);

      if (changes.bannedWords) {
        BanNotice.reloadConfig();
        Log.i('[Reload] 违禁词配置已更新');
      }

      if (changes.playerData) {
        PlayerData.reloadPlayerData();
        Log.i('[Reload] 玩家数据配置已更新');
      }

      return { 
        success: true, 
        changes: changes 
      };
    } catch (error) {
      Log.e('[Reload] 应用新配置失败', error);
      return { success: false, error: error.message };
    }
  }

  generateReloadReport(reloadResult) {
    if (!reloadResult.success) {
      return `❌ 热重载失败: ${reloadResult.error}`;
    }

    const config = reloadResult.config;
    const changes = reloadResult.changes || {};
    
    let msg = '✅ 配置重载完成\n\n';
    
    msg += '📊 当前配置状态:\n';
    msg += `• 服务器数量: ${config.服务器配置?.length || 0}\n`;
    msg += `• 群组数量: ${config.群组配置?.length ? config.群组配置.length - 1 : 0}\n`;
    msg += `• 违禁词数量: ${config.信息违禁词?.length || 0}\n`;
    msg += `• WebSocket端口: ${config.插件端口}\n`;
    msg += `• 命令前缀: ${config.命令前缀}\n`;

    // 显示变更详情
    if (changes.servers) {
      const { added, removed, modified } = changes.servers;
      if (added.length > 0 || removed.length > 0 || modified.length > 0) {
        msg += '\n🔄 服务器变更:\n';
        if (added.length > 0) msg += `• 新增: ${added.join(', ')}\n`;
        if (removed.length > 0) msg += `• 删除: ${removed.join(', ')}\n`;
        if (modified.length > 0) msg += `• 修改: ${modified.join(', ')}\n`;
      }
    }

    if (changes.wsConfig) {
      msg += '\n🌐 WebSocket配置已更新\n';
    }

    if (changes.bannedWords) {
      msg += '\n🚫 违禁词配置已更新\n';
    }

    return msg;
  }
}

export default new Reload();