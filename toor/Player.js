import Config from './Config.js'
import Log from './logs.js'
import Cache from './Cache.js'

class PlayerData {
  constructor() {
    this.playerData = {}
    this.dirtyFlags = new Set()
    this.isSaving = false
    this.saveDebounceTimer = null
    
    // 多级索引系统
    this.indices = {
      uuidToPlayer: new Map(),
      mcNameToPlayer: new Map(),
      groupNameToMC: new Map(),    // 群昵称 -> MC名称
      accountToMC: new Map(),      // 账号 -> MC名称
      serverPlayers: new Map(),
      opPlayers: new Set(),
    }
    
    this.loadPlayerData()
  }

  // 加载玩家数据
  loadPlayerData() {
    try {
      const config = Config.getConfig()
      this.playerData = config.玩家数据 || {}
      this.buildIndices()
      Log.i(`[PlayerData] 加载了 ${Object.keys(this.playerData).length} 个服务器的玩家数据`)
    } catch (error) {
      Log.e('[PlayerData] 加载玩家数据失败:', error)
      this.playerData = {}
    }
  }

  // 构建索引
  buildIndices() {
    this.clearIndices()
    
    for (const [serverName, players] of Object.entries(this.playerData)) {
      players.forEach(player => {
        this.addToIndices(player, serverName)
      })
    }
  }

  // 添加玩家到索引
  addToIndices(player, serverName) {
    if (!player.uuid) return
    this.indices.uuidToPlayer.set(player.uuid, player)
    
    const mcNameKey = `${player.服务器名称}@${serverName}`
    this.indices.mcNameToPlayer.set(mcNameKey, player)
    
    // 处理账号绑定索引
    if (Array.isArray(player.账号)) {
      player.账号.forEach(accountBind => {
        if (accountBind.账号) {
          // 账号 -> MC名称索引
          const accountKey = `${accountBind.账号}@${serverName}`
          this.indices.accountToMC.set(accountKey, player.服务器名称)
          
          // 群昵称 -> MC名称索引（如果有群绑定）
          if (Array.isArray(accountBind.群绑定)) {
            accountBind.群绑定.forEach(groupBind => {
              if (groupBind.群号 && groupBind.群名称) {
                const groupKey = `${groupBind.群名称}@${groupBind.群号}`
                this.indices.groupNameToMC.set(groupKey, player.服务器名称)
              }
            })
          }
        }
      })
    }
    
    if (player.OP玩家 === '是') {
      this.indices.opPlayers.add(player.uuid)
    }
    
    // 服务器玩家索引
    if (!this.indices.serverPlayers.has(serverName)) {
      this.indices.serverPlayers.set(serverName, new Set())
    }
    this.indices.serverPlayers.get(serverName).add(player.uuid)
  }

  // 从索引移除玩家
  removeFromIndices(player, serverName) {
    if (!player.uuid) return

    this.indices.uuidToPlayer.delete(player.uuid)
    
    const mcNameKey = `${player.服务器名称}@${serverName}`
    this.indices.mcNameToPlayer.delete(mcNameKey)
    
    // 移除账号相关索引
    if (Array.isArray(player.账号)) {
      player.账号.forEach(accountBind => {
        if (accountBind.账号) {
          const accountKey = `${accountBind.账号}@${serverName}`
          this.indices.accountToMC.delete(accountKey)
          
          // 移除群绑定索引
          if (Array.isArray(accountBind.群绑定)) {
            accountBind.群绑定.forEach(groupBind => {
              if (groupBind.群号 && groupBind.群名称) {
                const groupKey = `${groupBind.群名称}@${groupBind.群号}`
                this.indices.groupNameToMC.delete(groupKey)
              }
            })
          }
        }
      })
    }
    
    this.indices.opPlayers.delete(player.uuid)
    
    const serverPlayers = this.indices.serverPlayers.get(serverName)
    if (serverPlayers) {
      serverPlayers.delete(player.uuid)
      if (serverPlayers.size === 0) {
        this.indices.serverPlayers.delete(serverName)
      }
    }
  }

  // 清空索引
  clearIndices() {
    this.indices.uuidToPlayer.clear()
    this.indices.mcNameToPlayer.clear()
    this.indices.groupNameToMC.clear()
    this.indices.accountToMC.clear()
    this.indices.serverPlayers.clear()
    this.indices.opPlayers.clear()
  }

  // 处理玩家登录事件
  async handlePlayerJoin(eventData) {
    try {
      const { player, server_name } = eventData
      
      if (!player || !player.uuid || !player.nickname || !server_name) {
        Log.w('[PlayerData] 玩家登录事件数据不完整:', eventData)
        return false
      }

      const uuid = player.uuid
      const playerName = player.nickname
      const serverName = server_name
      const isOp = player.is_op || false

      if (!this.playerData[serverName]) {
        this.playerData[serverName] = []
      }

      const serverPlayers = this.playerData[serverName]
      const existingPlayerIndex = serverPlayers.findIndex(p => p.uuid === uuid)
      
      if (existingPlayerIndex !== -1) {
        const existingPlayer = serverPlayers[existingPlayerIndex]
        let updated = false
        
        if (existingPlayer.服务器名称 !== playerName) {
          Log.i(`[PlayerData] 玩家改名: ${existingPlayer.服务器名称} -> ${playerName}`)
          existingPlayer.服务器名称 = playerName
          updated = true
        }
        
        const opStatus = isOp ? '是' : '否'
        if (existingPlayer.OP玩家 !== opStatus) {
          Log.i(`[PlayerData] 玩家OP状态变更: ${existingPlayer.OP玩家} -> ${opStatus}`)
          existingPlayer.OP玩家 = opStatus
          updated = true
        }
        
        if (updated) {
          existingPlayer.最后更新时间 = new Date().toLocaleString('zh-CN')
          this.markDirty(serverName)
        }
      } else {
        Log.i(`[PlayerData] 创建新玩家: ${playerName} (${uuid}), OP: ${isOp}`)
        const newPlayer = {
          uuid: uuid,
          服务器名称: playerName,
          OP玩家: isOp ? '是' : '否',
          账号: [],  // 改为账号数组
          最后更新时间: new Date().toLocaleString('zh-CN')
        }
        serverPlayers.push(newPlayer)
        this.markDirty(serverName)
      }

      this.buildIndices()
      return true

    } catch (error) {
      Log.e('[PlayerData] 处理玩家登录事件失败:', error)
      return false
    }
  }

  // 绑定群内名称（新结构）
  async bindGroupName(mcPlayerName, account, groupId, groupName) {
    try {
      let targetPlayer = null
      let targetServer = null
      
      // 查找玩家
      for (const serverName in this.playerData) {
        const player = this.playerData[serverName].find(p => p.服务器名称 === mcPlayerName)
        if (player) {
          targetPlayer = player
          targetServer = serverName
          break
        }
      }
      
      if (!targetPlayer) {
        Log.w(`[PlayerData] 绑定失败: 未找到MC玩家 ${mcPlayerName}`)
        return { success: false, error: '玩家不存在' }
      }
      
      // 确保账号数组存在
      if (!Array.isArray(targetPlayer.账号)) {
        targetPlayer.账号 = []
      }
      
      // 查找或创建账号绑定
      let accountBind = targetPlayer.账号.find(a => a.账号 === account)
      if (!accountBind) {
        accountBind = {
          账号: account,
          群绑定: []
        }
        targetPlayer.账号.push(accountBind)
      }
      
      // 确保群绑定数组存在
      if (!Array.isArray(accountBind.群绑定)) {
        accountBind.群绑定 = []
      }
      
      // 查找或更新群绑定
      const existingGroupBindIndex = accountBind.群绑定.findIndex(bind => 
        bind.群号 === groupId
      )
      
      if (existingGroupBindIndex !== -1) {
        accountBind.群绑定[existingGroupBindIndex].群名称 = groupName
        Log.i(`[PlayerData] 更新绑定: ${mcPlayerName} (账号:${account}) -> 群${groupId}:${groupName}`)
      } else {
        accountBind.群绑定.push({
          群号: groupId,
          群名称: groupName
        })
        Log.i(`[PlayerData] 新增绑定: ${mcPlayerName} (账号:${account}) -> 群${groupId}:${groupName}`)
      }
      
      targetPlayer.最后更新时间 = new Date().toLocaleString('zh-CN')
      
      this.markDirty(targetServer)
      this.buildIndices() // 重新构建索引
      
      return { 
        success: true, 
        message: '绑定成功', 
        player: targetPlayer,
        server: targetServer
      }
    } catch (error) {
      Log.e('[PlayerData] 绑定群内名称失败:', error)
      return { success: false, error: '绑定失败' }
    }
  }

  // 标记脏数据并触发延迟保存
  markDirty(serverName) {
    this.dirtyFlags.add(serverName)
    
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer)
    }
    
    this.saveDebounceTimer = setTimeout(() => {
      this.saveDirtyData()
    }, 5000)
  }

  // 保存脏数据
  async saveDirtyData() {
    if (this.isSaving || this.dirtyFlags.size === 0) return
    
    this.isSaving = true
    try {
      
      const playerDataToSave = {};
      for (const [serverName, players] of Object.entries(this.playerData)) {
        playerDataToSave[serverName] = players.map(player => ({
          uuid: player.uuid,
          服务器名称: player.服务器名称,
          OP玩家: player.OP玩家,
          账号: Array.isArray(player.账号) ? player.账号 : [],
          最后更新时间: player.最后更新时间
        }));
      }
      
      const result = Cache.queueWrite('5玩家数据.yml', {
        玩家数据: playerDataToSave
      })
      
      if (result) {
        this.dirtyFlags.clear();
        
        const currentConfig = Config.getConfig();
        const newConfig = {
          ...currentConfig,
          玩家数据: playerDataToSave
        };
        Config.forceUpdateCache(newConfig);
      } else {
        console.error('[PlayerData DEBUG] 加入写入队列失败');
      }
    } catch (error) {
      console.error('[PlayerData DEBUG] 保存脏数据异常:', error);
      Log.e('[PlayerData] 保存脏数据失败:', error);
    } finally {
      this.isSaving = false;
    }
  }

  // ========== 查询方法（使用索引优化） ==========

  getPlayerByUUID(uuid, serverName = null) {
    const player = this.indices.uuidToPlayer.get(uuid)
    if (!player) return null
    
    if (serverName) {
      const serverPlayers = this.indices.serverPlayers.get(serverName)
      return serverPlayers && serverPlayers.has(uuid) ? player : null
    }
    
    return player
  }

  getPlayerByMCName(mcName, serverName = null) {
    if (serverName) {
      const key = `${mcName}@${serverName}`
      return this.indices.mcNameToPlayer.get(key)
    }
    
    // 如果没有指定服务器，返回第一个找到的玩家
    for (const [sName] of Object.entries(this.playerData)) {
      const key = `${mcName}@${sName}`
      const player = this.indices.mcNameToPlayer.get(key)
      if (player) return player
    }
    
    return null
  }

  // 通过账号获取MC名称
  getMCNameByAccount(account, serverName = null) {
    if (serverName) {
      const key = `${account}@${serverName}`
      return this.indices.accountToMC.get(key)
    }
    
    // 如果没有指定服务器，返回第一个找到的绑定
    for (const [key, mcName] of this.indices.accountToMC) {
      if (key.startsWith(`${account}@`)) {
        return mcName
      }
    }
    
    return null
  }

  // 通过群昵称获取MC名称
  getMCNameByGroupName(groupName, groupId = null) {
    if (groupId) {
      const key = `${groupName}@${groupId}`
      return this.indices.groupNameToMC.get(key)
    }
    
    // 如果没有指定群号，返回第一个找到的绑定
    for (const [key, mcName] of this.indices.groupNameToMC) {
      if (key.startsWith(`${groupName}@`)) {
        return mcName
      }
    }
    
    return null
  }

  // 获取群昵称（优先使用指定群的绑定）
  getGroupNameByMCName(mcName, groupId = null) {
    const player = this.getPlayerByMCName(mcName)
    if (!player || !Array.isArray(player.账号)) return null
    
    // 遍历所有账号的群绑定
    for (const accountBind of player.账号) {
      if (Array.isArray(accountBind.群绑定)) {
        if (groupId) {
          // 优先返回指定群的绑定
          const bind = accountBind.群绑定.find(b => b.群号 === groupId)
          if (bind) return bind.群名称
        } else {
          // 返回第一个找到的群绑定
          if (accountBind.群绑定.length > 0) {
            return accountBind.群绑定[0].群名称
          }
        }
      }
    }
    
    return null
  }

  // 获取账号（用于反向查找）
  getAccountByMCName(mcName, serverName = null) {
    const player = this.getPlayerByMCName(mcName, serverName)
    if (!player || !Array.isArray(player.账号)) return null
    
    return player.账号.length > 0 ? player.账号[0].账号 : null
  }

  isPlayerOP(mcName, serverName = null) {
    const player = this.getPlayerByMCName(mcName, serverName)
    return player ? this.indices.opPlayers.has(player.uuid) : false
  }

  getAllPlayers() {
    const allPlayers = []
    for (const serverName in this.playerData) {
      allPlayers.push(...this.playerData[serverName].map(player => ({
        ...player,
        所在服务器: serverName
      })))
    }
    return allPlayers
  }

  getPlayersByServer(serverName) {
    const playerUUIDs = this.indices.serverPlayers.get(serverName)
    if (!playerUUIDs) return []
    
    return Array.from(playerUUIDs)
      .map(uuid => this.indices.uuidToPlayer.get(uuid))
      .filter(Boolean)
  }

  // 获取统计信息
  getStats() {
    let totalPlayers = 0
    let playersWithBinds = 0
    let opPlayers = 0
    let totalAccounts = 0
    let totalGroupBinds = 0
    
    for (const serverName in this.playerData) {
      totalPlayers += this.playerData[serverName].length
      playersWithBinds += this.playerData[serverName].filter(p => 
        Array.isArray(p.账号) && p.账号.length > 0
      ).length
      opPlayers += this.playerData[serverName].filter(p => p.OP玩家 === '是').length
      
      // 统计账号和群绑定数量
      this.playerData[serverName].forEach(p => {
        if (Array.isArray(p.账号)) {
          totalAccounts += p.账号.length
          p.账号.forEach(account => {
            if (Array.isArray(account.群绑定)) {
              totalGroupBinds += account.群绑定.length
            }
          })
        }
      })
    }
    
    return {
      totalPlayers,
      playersWithBinds,
      opPlayers,
      totalAccounts,
      totalGroupBinds,
      serverCount: Object.keys(this.playerData).length,
      dirtyServers: this.dirtyFlags.size,
      cacheStatus: Cache.getStatus()
    }
  }

  // 重载玩家数据
  reloadPlayerData() {
    try {
      this.loadPlayerData()
      Log.i('[PlayerData] 玩家数据重载完成')
      return true
    } catch (error) {
      Log.e('[PlayerData] 重载玩家数据失败:', error)
      return false
    }
  }

  // 强制保存所有数据
  async forceSave() {
    Log.i('[PlayerData] 强制保存玩家数据')
    await Cache.forceFlush()
  }
}

export default new PlayerData()