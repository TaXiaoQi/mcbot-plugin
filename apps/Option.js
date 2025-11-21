import Log from '../toor/logs.js'                     // 日志
import Reload from '../toor/Reload.js'                // 重载
import Config from '../toor/Config.js'                // 配置
import RconConnectList from './Rcon.js'               // rcon
import WebSocket from './WebSocket.js'                // ws
import BanNotice from '../toor/BanNotice.js'          // 违禁词
import Turn from '../toor/Turn.js'                    // 翻译
import PlayerData from '../toor/Player.js'            // 玩家数据

class Option {
  constructor() {
    console.log('[Option] Option指令处理器已初始化');
  }

  // 统一的指令处理入口
  static async handleCommand(e) {
    try {
      const command = e.raw_message.trim();
      
      if (!command.startsWith('#')) {
        return false; 
      }

      const cmd = command.slice(1).trim();
      console.log(`[Option] 处理指令: ${cmd}`);
      const option = new Option(); 
      switch(true) {
        case /^mc(重载|重新载入|重载)$/.test(cmd):
          await option.reloadConfig(e);
          return true;
          
        case /^mc调试$/.test(cmd):
          await option.debugConfig(e);
          return true;
          
        case /^绑定 (.+)$/.test(cmd):
          await option.bindPlayer(e);
          return true;
          
        case /^mc玩家列表$/.test(cmd):
          await option.showPlayerList(e);
          return true;
          
        case /^mc查找玩家 (.+)$/.test(cmd):
          await option.searchPlayer(e);
          return true;
          
        case /^mc翻译统计$/.test(cmd):
          await option.translationStats(e);
          return true;
          
        case /^mc缓存状态$/.test(cmd):
          await option.cacheStatus(e);
          return true;
          
        default:
          console.log(`[Option] 未知指令: ${cmd}`);
          return false;
      }
    } catch (error) {
      Log.e('[Option] 指令处理异常', error);
      return false;
    }
  }

  async reloadConfig(e) {
    try {
      const reloadResult = await Reload.executeHotReload();
      const msg = Reload.generateReloadReport(reloadResult);
      e.reply(msg, true);
    } catch (err) {
      Log.e('重载配置失败', err);
      e.reply('❌ 重载配置失败，请查看控制台日志', true);
    }
    return true;
  }

  // 翻译统计命令
  async translationStats(e) {
    try {
      const stats = Turn.getStats();
      
      let msg = '🔤 MC翻译统计信息\n\n';
      msg += `💀 死亡消息翻译: ${stats.deathMessages} 条\n`;
      msg += `🎮 命令返回翻译: ${stats.commandResponses} 条\n`;
      msg += `🏆 成就进度翻译: ${stats.advancements} 条\n`;
      msg += `📊 总计: ${stats.deathMessages + stats.commandResponses + stats.advancements} 条翻译规则`;
      
      e.reply(msg, true);
    } catch (error) {
      Log.e('翻译统计失败', error);
      e.reply('❌ 翻译统计失败，请查看控制台日志', true);
    }
    return true;
  }

  // 调试配置信息
  async debugConfig(e) {
    try {
      const config = Config.getConfig(true);
      const turnStats = Turn.getStats();
      const playerStats = PlayerData.getStats();

      let msg = '🔧 MC插件配置调试信息\n\n';
      
      msg += `📋 基础配置:\n`;
      msg += `• 插件端口: ${config.插件端口 || '未设置'}\n`;
      msg += `• 插件网址: ${config.插件网址 || '未设置'}\n`;
      msg += `• 命令前缀: ${config.命令前缀 || '未设置'}\n\n`;
      
      msg += `🎮 服务器配置 (${config.服务器配置?.length || 0}个):\n`;
      if (config.服务器配置 && Array.isArray(config.服务器配置)) {
        config.服务器配置.forEach(server => {
          if (server.服务器名称 !== 'default_server') {
            msg += `• ${server.服务器名称}: 前缀"${server.前缀}", RCON: ${server.rcon网址}:${server.rcon端口}\n`;
          }
        });
      } else {
        msg += `• 无服务器配置或配置格式错误\n`;
      }
      
      msg += `👥 群组配置 (${config.群组配置?.length || 0}个):\n`;
      if (config.群组配置 && Array.isArray(config.群组配置)) {
        config.群组配置.forEach(group => {
          if (group.群号 !== 'default_group') {
            msg += `• 群${group.群号}: ${group.群名称} (${group.同步服务器的所有消息 === '是' ? '同步所有' : '选择性同步'})\n`;
          }
        });
      } else {
        msg += `• 无群组配置或配置格式错误\n`;
      }
      
      const rconStats = RconConnectList.getConnectionStats();
      msg += `\n🔌 RCON连接状态:\n`;
      msg += `• 总连接: ${rconStats.total}\n`;
      msg += `• 已连接: ${rconStats.connected}\n`;
      msg += `• 连接中: ${rconStats.connecting}\n`;
      msg += `• 未连接: ${rconStats.disconnected}\n`;
      
      const wsConnections = WebSocket.getActiveServers();
      msg += `\n🌐 WebSocket连接: ${wsConnections.length}个\n`;
      if (wsConnections.length > 0) {
        wsConnections.forEach(server => {
          msg += `• ${server.name}\n`;
        });
      } else {
        msg += `• 无活跃连接\n`;
      }
      
      const banNoticeStats = BanNotice.getStats();
      msg += `\n🚫 违禁词配置:\n`;
      msg += `• 违禁词数量: ${banNoticeStats.wordCount}\n`;
      msg += `• 替换文本: ${banNoticeStats.replaceText}\n`;

      msg += `🔤 翻译配置:\n`;
      msg += `• 死亡消息: ${turnStats.deathMessages} 条\n`;
      msg += `• 命令返回: ${turnStats.commandResponses} 条\n`;
      msg += `• 成就进度: ${turnStats.advancements} 条\n`;

      msg += `\n👤 玩家数据统计:\n`;
      msg += `• 总玩家数: ${playerStats.totalPlayers}\n`;
      msg += `• 已绑定玩家: ${playerStats.playersWithBinds}\n`;
      msg += `• OP玩家: ${playerStats.opPlayers}\n`;
      msg += `• 服务器数量: ${playerStats.serverCount}\n`;
      msg += `• 待保存数据: ${playerStats.dirtyServers}个服务器\n`;
      msg += `• 缓存命中率: ${playerStats.cacheStatus?.cacheHitRate || '0%'}\n`;
      
      e.reply(msg, true);
      
    } catch (error) {
      Log.e('配置调试失败', error);
      e.reply('❌ 配置调试失败，请查看控制台日志', true);
    }
  }

  // 绑定玩家命令
  async bindPlayer(e) {
    try {
      console.log('[DEBUG] 绑定命令触发，消息内容:', e.raw_message);
      
      // 使用 e.raw_message 而不是 e.msg
      const match = e.raw_message.match(/^#绑定\s+(.+)$/);
      if (!match) {
        e.reply('❌ 使用方法: #绑定 <MC玩家名称>')
        return true
      }
      
      const targetMCName = match[1].trim();
      if (!targetMCName) {
        e.reply('❌ 使用方法: #绑定 <MC玩家名称>')
        return true
      }
  
      const account = e.user_id; // 用户QQ号作为账号
      const groupId = e.group_id; // 群号
      
      // 优先使用群昵称，没有则使用QQ昵称
      const groupDisplayName = e.sender.card && e.sender.card.trim() ? e.sender.card.trim() : e.sender.nickname;
  
      // 执行绑定（使用新的方法签名）
      const bindResult = await PlayerData.bindGroupName(targetMCName, account, groupId, groupDisplayName);
      
      if (bindResult.success) {
        const player = bindResult.player
        let replyMsg = `✅ ${player.服务器名称} 绑定成功`
        
        // 显示服务器信息
        if (bindResult.server) {
          replyMsg += `\n🏠 服务器: ${bindResult.server}`
        }
        
        // 显示OP状态
        if (player.OP玩家 === '是') {
          replyMsg += `\n👑 该玩家是服务器OP`
        }
        
        // 显示绑定的群信息 - 使用新的数据结构
        if (Array.isArray(player.账号)) {
          const accountBind = player.账号.find(a => a.账号 === account);
          if (accountBind && Array.isArray(accountBind.群绑定)) {
            const currentBind = accountBind.群绑定.find(bind => bind.群号 === groupId)
            if (currentBind) {
              replyMsg += `\n💬 绑定群: ${currentBind.群名称} (群${currentBind.群号})`
            }
          }
        }
        
        e.reply(replyMsg)
      } else {
        if (bindResult.error === '玩家不存在') {
          e.reply(`❌ "${targetMCName}" 玩家不存在 \n⚠️ 请先登录服务器再绑定`)
        } else {
          e.reply('❌ 绑定失败，请稍后重试')
        }
      }
      
      return true
    } catch (error) {
      Log.e('[Option] 处理绑定命令失败:', error)
      e.reply('❌ 绑定命令处理失败')
      return true
    }
  }

  // 显示玩家列表
  async searchPlayer(e) {
    try {
      // 使用 e.raw_message 而不是 e.msg
      const match = e.raw_message.match(/^#?mc查找玩家\s+(.+)$/);
      if (!match) {
        e.reply('❌ 请输入搜索关键词');
        return true;
      }
  
      const keyword = match[1].trim();
      const players = PlayerData.getAllPlayers();
      const results = players.filter(player => 
        player.服务器名称.includes(keyword) || 
        (Array.isArray(player.群号名称) && player.群号名称.some(bind => 
          bind.群名称.includes(keyword) || bind.群号.toString().includes(keyword)
        )) ||
        player.uuid.includes(keyword) ||
        (player.所在服务器 && player.所在服务器.includes(keyword))
      );
  
      if (results.length === 0) {
        e.reply(`🔍 未找到包含 "${keyword}" 的玩家`);
        return true;
      }
  
      let msg = `🔍 搜索 "${keyword}" 结果 (${results.length}个):\n\n`;
      results.forEach((player, index) => {
        msg += `${index + 1}. ${player.服务器名称}\n`;
        msg += `   UUID: ${player.uuid}\n`;
        msg += `   所在服务器: ${player.所在服务器 || '未知'}\n`;
        
        // 修复：使用新的群号名称数据结构
        if (Array.isArray(player.群号名称) && player.群号名称.length > 0) {
          const bindInfo = player.群号名称.map(bind => 
            `${bind.群名称} (群${bind.群号})`
          ).join(', ');
          msg += `   群绑定: ${bindInfo}\n`;
        } else {
          msg += `   群绑定: 无\n`;
        }
        
        msg += `   OP状态: ${player.OP玩家}\n`;
        msg += `   最后更新: ${player.最后更新时间}\n\n`;
      });
  
      e.reply(msg, true);
    } catch (error) {
      Log.e('搜索玩家失败', error);
      e.reply('❌ 搜索玩家失败');
    }
    return true;
  }

  // 搜索玩家 - 修复数据结构
  async searchPlayer(e) {
    try {
      const keyword = e.msg.replace(/^#?mc查找玩家 /, '').trim();
      if (!keyword) {
        e.reply('❌ 请输入搜索关键词');
        return true;
      }

      const players = PlayerData.getAllPlayers();
      const results = players.filter(player => 
        player.服务器名称.includes(keyword) || 
        (Array.isArray(player.群号名称) && player.群号名称.some(bind => 
          bind.群名称.includes(keyword) || bind.群号.toString().includes(keyword)
        )) ||
        player.uuid.includes(keyword) ||
        (player.所在服务器 && player.所在服务器.includes(keyword))
      );

      if (results.length === 0) {
        e.reply(`🔍 未找到包含 "${keyword}" 的玩家`);
        return true;
      }

      let msg = `🔍 搜索 "${keyword}" 结果 (${results.length}个):\n\n`;
      results.forEach((player, index) => {
        msg += `${index + 1}. ${player.服务器名称}\n`;
        msg += `   UUID: ${player.uuid}\n`;
        msg += `   所在服务器: ${player.所在服务器 || '未知'}\n`;
        
        // 修复：使用新的群号名称数据结构
        if (Array.isArray(player.群号名称) && player.群号名称.length > 0) {
          const bindInfo = player.群号名称.map(bind => 
            `${bind.群名称} (群${bind.群号})`
          ).join(', ');
          msg += `   群绑定: ${bindInfo}\n`;
        } else {
          msg += `   群绑定: 无\n`;
        }
        
        msg += `   OP状态: ${player.OP玩家}\n`;
        msg += `   最后更新: ${player.最后更新时间}\n\n`;
      });

      e.reply(msg, true);
    } catch (error) {
      Log.e('搜索玩家失败', error);
      e.reply('❌ 搜索玩家失败');
    }
    return true;
  }

  // 缓存状态命令
  async cacheStatus(e) {
    try {
      const playerStats = PlayerData.getStats();
      const configStats = Config.getStats();
      
      let msg = '💾 缓存状态信息\n\n';
      
      msg += `📊 玩家数据:\n`;
      msg += `• 总玩家数: ${playerStats.totalPlayers}\n`;
      msg += `• 已绑定玩家: ${playerStats.playersWithBinds}\n`;
      msg += `• OP玩家: ${playerStats.opPlayers}\n`;
      msg += `• 服务器数量: ${playerStats.serverCount}\n`;
      msg += `• 待保存数据: ${playerStats.dirtyServers}个服务器\n\n`;
      
      msg += `⚡ 性能统计:\n`;
      msg += `• 缓存命中率: ${playerStats.cacheStatus?.cacheHitRate || '0%'}\n`;
      msg += `• 总查询次数: ${playerStats.cacheStatus?.totalQueries || 0}\n`;
      msg += `• 平均响应时间: ${playerStats.cacheStatus?.averageResponseTime || '0ms'}\n\n`;
      
      msg += `📁 写入队列:\n`;
      msg += `• 队列大小: ${playerStats.cacheStatus?.queueSize || 0}\n`;
      msg += `• 正在写入: ${playerStats.cacheStatus?.isWriting ? '是' : '否'}\n`;
      msg += `• 待写入文件: ${playerStats.cacheStatus?.pendingWrites || 0}\n`;
      
      e.reply(msg, true);
    } catch (error) {
      Log.e('获取缓存状态失败', error);
      e.reply('❌ 获取缓存状态失败');
    }
    return true;
  }
}

export default Option;