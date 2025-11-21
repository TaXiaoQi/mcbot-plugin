import RconConnectList from './Rcon.js'       // rcon
import Config from '../toor/Config.js'        // 配置
import BanNotice from '../toor/BanNotice.js'  // 违禁词
import Log from '../toor/logs.js'             // 日志
import Turn from '../toor/Turn.js'            // 翻译
import PlayerData from '../toor/Player.js'    // 玩家数据库
class Message {
  constructor() {
  }

  async handleWebSocketMessage(type, data) {
    const config = Config.getConfig();
    
    switch (type) {
      case 'minecraft_event':
        console.log('Minecraft事件子类型:', data.sub_type);
        await this.handleMinecraftEvent(data, config);
        break;
      case 'server_online':
        await this.handleServerOnline(data.serverName, config);
        break;
      case 'server_offline':
        await this.handleServerOffline(data.serverName, config);
        break;
      default:
        console.log('未知的WebSocket消息类型:', type);
    }
  }

  // 处理Mc事件
  async handleMinecraftEvent(event, config) {
    const serverName = event.server_name;

    // 玩家登录，自动记录数据
    if (event.sub_type === 'join') {
      PlayerData.handlePlayerJoin(event)
    }
    
    switch (event.sub_type) {
      case 'quit':
        await this.sendEventMessage(
          `【${serverName}】${event.player.nickname} 已退出游戏`, 
          serverName, 
          '玩家登出通知',
          config
        );
        break;
      case 'join':
        await this.sendEventMessage(
          `【${serverName}】${event.player.nickname} 已加入游戏`, 
          serverName, 
          '玩家登入通知',
          config
        );
        break;
      case 'death':
        const deathMessage = event.message || '死亡了';
        const translatedDeath = Turn.translate(deathMessage, 'death');
        await this.sendEventMessage(
          `【${serverName}】${translatedDeath}`, 
          serverName, 
          '玩家死亡通知',
          config
        );
        break;
      case 'chat':
        const filteredMessage = BanNotice.filterText(event.message);
        
        await this.sendEventMessage(
          `【${serverName}】${event.player.nickname}:${filteredMessage}`, 
          serverName, 
          '玩家聊天通知',
          config,
          true,
          event
        );
        break;
      case 'achievement':
        const advancementTitle = event.advancement?.display?.title || '达成了成就';
        const translatedAdvancement = Turn.translate(advancementTitle, 'advancement');
        await this.sendEventMessage(
          `【${serverName}】${event.player.nickname} 达成了成就: ${translatedAdvancement}`, 
        serverName, 
        '玩家成就通知',
        config
      );
        break;
      case 'player_command':
        await this.sendEventMessage(
          `【${serverName}】${event.player.nickname} 在服务器执行了指令: /${event.message}`,
          serverName,
          '玩家命令通知',
          config
        );
        break;
      default:
        console.log('未知的事件类型:', event.sub_type);
        console.log('完整事件数据:', JSON.stringify(event, null, 2));
    }
  }

  // 服务器上线
  async handleServerOnline(serverName, config) {
    await this.sendServerStatusMessage(serverName, 'online', config);
  }

  // 服务器下线
  async handleServerOffline(serverName, config) {
    await this.sendServerStatusMessage(serverName, 'offline', config);
  }

  // 发消息到QQ群
  async sendEventMessage(msg, serverName, eventType, config, isJudHeader = false, event = null) {
    if (!config.群组配置 || !Array.isArray(config.群组配置)) {
      Log.w(`[Message] 群组配置不存在，无法发送事件消息: ${eventType}`);
      return;
    }
    const serverSeparator = config.服转群 || '说';
    for (let groupConfig of config.群组配置) {
      const groupId = groupConfig.群号;
      if (groupId === 'default_group') {
        continue;
      }
      if (this.shouldNotifyEvent(groupId, serverName, eventType, config)) {
        if (!isJudHeader || new RegExp(':' + groupConfig.前缀).exec(msg)) {
          let finalMsg = isJudHeader ? 
            msg.replace(new RegExp(':' + groupConfig.前缀), ':') : 
            msg;
          
          if (eventType === '玩家聊天通知') {
            // 修复：使用 event 参数获取玩家名称
            const originalName = finalMsg.match(/【.*?】(.*?):/)?.[1] || (event?.player?.nickname || '玩家');
            let displayName = originalName;
          
            const boundGroupName = PlayerData.getGroupNameByMCName(originalName, groupId);
            if (boundGroupName) {
              displayName = boundGroupName;
              Log.i(`[Message] 服转群使用绑定名称: ${originalName} -> ${boundGroupName} (群${groupId})`);
            }
            
            // 重新构建消息格式
            finalMsg = finalMsg.replace(
              /(【.*?】).*?:(.*)/, 
              `$1${displayName} ${serverSeparator} $2`
            );
          }
          
          this.safeSendGroupMsg(groupId, finalMsg);
        }
      }
    }
  }

  // 发服务器状态
  async sendServerStatusMessage(serverName, status, config) {
    if (!config.群组配置 || !Array.isArray(config.群组配置)) {
      return;
    }
    
    for (let groupConfig of config.群组配置) {
      const groupId = groupConfig.群号;
      
      if (groupId === 'default_group') {
        continue;
      }
      
      const shouldNotify = this.shouldNotifyServerStatus(groupId, serverName, config);
      
      if (shouldNotify) {
        const message = status === 'online' 
          ? `【MC】[${serverName}] 周目已上线`
          : `【MC】[${serverName}] 周目已下线`;
        
        setTimeout(() => {
          this.safeSendGroupMsg(groupId, message);
        }, 2000);
      }
    }
  }

  // 获取群配置
  getGroupConfig(config, groupId) {
    if (!config.群组配置 || !Array.isArray(config.群组配置)) {
      return null;
    }
    
    const targetGroupId = String(groupId);
    
    const specificGroup = config.群组配置.find(group => {
      const configGroupId = String(group.群号);
      return configGroupId === targetGroupId;
    });
    
    if (specificGroup) {
      return specificGroup;
    }
    
    const defaultGroup = config.群组配置.find(group => 
      String(group.群号) === 'default_group'
    );
    
    return defaultGroup || null;
  }

  // 检查信息发送
  shouldNotifyEvent(groupId, serverName, eventType, config) {
    const groupConfig = this.getGroupConfig(config, groupId);
    if (!groupConfig) return false;
    
    if (groupConfig.同步服务器的所有消息 === '是') {
      return true;
    }
    switch (eventType) {
      case '玩家登入通知':
        return Array.isArray(groupConfig.玩家登入通知) && 
               groupConfig.玩家登入通知.includes(serverName);
      case '玩家登出通知':
        return Array.isArray(groupConfig.玩家登出通知) && 
              groupConfig.玩家登出通知.includes(serverName);
      case '玩家死亡通知':
        return Array.isArray(groupConfig.玩家死亡通知) && 
               groupConfig.玩家死亡通知.includes(serverName);
      case '玩家成就通知':
        return Array.isArray(groupConfig.玩家成就通知) && 
               groupConfig.玩家成就通知.includes(serverName);
      case '玩家聊天通知':
        return Array.isArray(groupConfig.玩家聊天通知) && 
               groupConfig.玩家聊天通知.includes(serverName);
      case '玩家命令通知':
        return Array.isArray(groupConfig.玩家命令通知) && 
               groupConfig.玩家命令通知.includes(serverName);
      default:
        return false;
    }
  }

  // 判断是否应该发送服务器状态通知
  shouldNotifyServerStatus(groupId, serverName, config) {
    const groupConfig = this.getGroupConfig(config, groupId);
    if (!groupConfig) return false;
    
    if (groupConfig.同步服务器的所有消息 === '是') {
      return true;
    }
    
    return Array.isArray(groupConfig.开关服通知) && 
           groupConfig.开关服通知.includes(serverName);
  }

  // 群消息发送
  safeSendGroupMsg(groupId, message) {
    try {
      if (typeof Bot === 'undefined' || !Bot.pickGroup) {
        Log.w(`[Message] Bot未定义，无法发送消息到群${groupId}`);
        return;
      }
      const group = Bot.pickGroup(groupId);
      if (group && typeof group.sendMsg === 'function') {
        group.sendMsg(message);
      } else {
        Log.w(`[Message] 无法找到群${groupId}或sendMsg方法不可用`);
      }
    } catch (error) {
      Log.e(`[Message] 发送消息到群${groupId}失败:`, error);
    }
  }

  // 主消息处理函数
  async message(e) {
    const config = Config.getConfig();
    const activeConnections = RconConnectList.getAllConnections();
    console.log(`[Message] 收到消息: "${e.raw_message}"`);
    for (let serverName in activeConnections) {
      const rconConnection = activeConnections[serverName];
      if (e.raw_message.startsWith(rconConnection.前缀 + config.命令前缀)) {
        let shell = e.raw_message.replace(new RegExp(rconConnection.前缀 + config.命令前缀, 'g'), '');
        
        shell = this.translateAtMessages(shell, e.group_id, serverName);
        const senderMCName = PlayerData.getMCNameByAccount(e.user_id, serverName);
        const isOP = senderMCName ? PlayerData.isPlayerOP(senderMCName, serverName) : false;
        
        if (e.isMaster) {
          Log.i(`[Message] 主人 ${e.sender.nickname} 执行指令: ${shell} (服务器: ${serverName})`);
          await rconConnection.sendCommand(e, shell, true);
          return false;
        }
        
        if (isOP) {
          Log.i(`[Message] OP玩家 ${senderMCName || e.sender.nickname} 执行指令: ${shell} (服务器: ${serverName})`);
          await rconConnection.sendCommand(e, shell, true);
          return false;
        } else {
          const serverConfig = config.服务器配置.find(s => s.服务器名称 === serverName);
          const hasAllowedCommands = serverConfig && 
            Array.isArray(serverConfig.指令列表) && 
            serverConfig.指令列表.length > 0;
          
          if (hasAllowedCommands) {
            const isAllowed = serverConfig.指令列表.some(allowedCmd => 
              shell.trim().toLowerCase().startsWith(allowedCmd.toLowerCase())
            );
            
            if (isAllowed) {
              await rconConnection.sendCommand(e, shell, true);
              return false;
            } else {
              Log.w(`[Message] 非OP玩家 ${senderMCName || e.sender.nickname} 尝试执行未允许的命令: ${shell} (服务器: ${serverName})`);
              e.reply('❌ 您没有权限使用此命令或命令不存在。');
              return false;
            }
          } else {
            Log.w(`[Message] 服务器 ${serverName} 未启用普通群友指令功能`);
            e.reply('❌ 该服务器未启用普通群友指令功能。');
            return false;
          }
        }
      }
    }

    // 处理群转服信息
    const isGroupMessage = e.isGroup || e.message_type === 'group' || e.group_id;
    if (isGroupMessage) {
      const groupConfig = this.getGroupConfig(config, e.group_id);

      const isGroupEnabled = groupConfig && (
        groupConfig.同步服务器的所有消息 === '是' || 
        (groupConfig.同步服务器的所有消息 === '否' && 
        Array.isArray(groupConfig.玩家聊天通知) && 
        groupConfig.玩家聊天通知.length > 0)
      );
      
      if (isGroupEnabled) {
        let shell = ''; 
        const separator = config.群转服 || ' ';
        
        let mcName = PlayerData.getMCNameByAccount(e.user_id); 
        let displayName = mcName || e.sender.nickname;
        
        const groupPrefix = groupConfig.显示群名 === '是' 
            ? `<${displayName}> 在[${groupConfig.群名称}]${separator} ` 
            : `<${displayName}> ${separator} `;
        for (let serverName in activeConnections) {
          const rconConnection = activeConnections[serverName];
          
          if (e.raw_message.startsWith(rconConnection.前缀)) {
            
            const shouldForward = groupConfig.同步服务器的所有消息 === '是' || 
                                (Array.isArray(groupConfig.玩家聊天通知) && 
                                groupConfig.玩家聊天通知.includes(serverName));
            
            if (!shouldForward) {
              continue;
            }
            
            if (e.img) {
              const messageContent = e.raw_message.replace(rconConnection.前缀, '').trim();
              shell = `tellraw @a {"text":"","extra":[{"text":"${groupPrefix}§2${messageContent}","color":"white","bold":false,"clickEvent":{"action":"open_url","value":"${e.img[0]}"}}]}`;
            } else {
              const messageContent = e.raw_message.replace(rconConnection.前缀, '').trim();
              const filteredMessage = BanNotice.filterText(messageContent);
              shell = `tellraw @a {"text":"${groupPrefix}${filteredMessage}","color":"white"}`;
            }
            
            const result = await rconConnection.sendCommand(e, shell, false);
          }
        }
      } else {
        Log.i(`[Message] 群${e.group_id} 未启用消息转发`);
      }
    }
    return false;
  }
  // 翻译@消息：将@群昵称翻译为MC名称
  translateAtMessages(message, groupId, serverName = null) {
    try {
      // 匹配@消息格式：@群昵称
      const atPattern = /@([^\s@]+)/g;
      
      return message.replace(atPattern, (match, groupName) => {
        // 通过群昵称和群号查找对应的MC名称
        const mcName = PlayerData.getMCNameByGroupName(groupName, groupId);
        
        if (mcName) {
          Log.i(`[Message] @消息翻译: @${groupName} -> ${mcName}`);
          return mcName; // 替换为MC名称
        } else {
          Log.w(`[Message] @消息翻译失败: 未找到群昵称 ${groupName} 的绑定`);
          return match; // 保持原样
        }
      });
    } catch (error) {
      Log.e('[Message] @消息翻译失败:', error);
      return message; // 出错时返回原消息
    }
  }
}
    
export default new Message();