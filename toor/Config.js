import Cache from './Cache.js'
import Path from './Path.js'

class Config {
  constructor() {
    this._cachedConfig = null;
    this._lastValidConfig = null;
    this._initialized = false;
    this.configDir = Path.getConfigDir();
  }

  // 只读方法
  loadConfigFile(filename) {
    return Cache.readFile(filename) || {};
  }

  // 写入方法
  saveConfigFile(filename, data) {
    return Cache.queueWrite(filename, data);
  }

  // 立即写入
  saveConfigFileImmediate(filename, data) {
    return Cache.immediateWrite(filename, data);
  }

  loadMergedConfig(forceReload = false) {
    try {
      if (forceReload || !this._cachedConfig) {
        const config = {};
        
        const mainConfig = this.loadConfigFile('1插件.yml');
        Object.assign(config, mainConfig);
        
        const groupsConfig = this.loadConfigFile('2群组.yaml');
        if (groupsConfig && groupsConfig.群组配置) {
          config.群组配置 = this.fixGroupConfig(groupsConfig.群组配置);
        }
        
        const serversConfig = this.loadConfigFile('3服务器.yml');
        if (serversConfig && serversConfig.服务器配置) {
          config.服务器配置 = serversConfig.服务器配置;
        }
        
        const bannedWordsConfig = this.loadConfigFile('4违禁词.yml');
        if (bannedWordsConfig) {
          config.信息违禁词 = bannedWordsConfig.信息违禁词;
          config.违禁词替换 = bannedWordsConfig.违禁词替换;
        }
        const playerDataConfig = this.loadConfigFile('5玩家数据.yml');
        if (playerDataConfig && playerDataConfig.玩家数据) {
          config.玩家数据 = playerDataConfig.玩家数据;
        } else {
          console.log('[Config DEBUG] 未找到玩家数据或格式错误');
          config.玩家数据 = {};
        }

        this._cachedConfig = config;
      }
      return this._cachedConfig;
    } catch (err) {
      console.error('[Config] 读取合并配置失败', err);
      return this._lastValidConfig || false;
    }
  }

  fixGroupConfig(groupConfig) {
    if (!Array.isArray(groupConfig)) {
      return groupConfig;
    }
    
    return groupConfig.map(group => {
      if (group.群号 && typeof group.群号 === 'object') {
        console.warn('[Config] 检测到异常的群号格式，尝试修复:', group.群号);
        
        const groupIdKeys = Object.keys(group.群号);
        if (groupIdKeys.length > 0) {
          const fixedGroupId = group.群号[groupIdKeys[0]];
          console.log(`[Config] 修复群号: ${groupIdKeys[0]} -> ${fixedGroupId}`);
          return {
            ...group,
            群号: fixedGroupId
          };
        }
      }
      return group;
    });
  }

  // 保存拆分配置
  saveSplitConfig(configData) {
    try {
      const validation = this.validateConfig(configData);
      if (!validation.valid) {
        console.error('[Config] 配置验证失败，拒绝保存:', validation.errors);
        return false;
      }
      
      Cache.queueWrite('1插件.yml', {
        插件网址: configData.插件网址,
        插件端口: configData.插件端口,
        命令前缀: configData.命令前缀,
        服转群: configData.服转群,
        群转服: configData.群转服
      });
      
      Cache.queueWrite('2群组.yaml', {
        群组配置: configData.群组配置
      });
      
      Cache.queueWrite('3服务器.yml', {
        服务器配置: configData.服务器配置
      });
      
      Cache.queueWrite('4违禁词.yml', {
        信息违禁词: configData.信息违禁词,
        违禁词替换: configData.违禁词替换
      });

      Cache.queueWrite('5玩家数据.yml', {
        玩家数据: configData.玩家数据 || []
      });
      
      this._cachedConfig = configData;
      this._lastValidConfig = configData;
      console.log('[Config] 拆分配置已加入写入队列');
      return true;
    } catch (err) {
      console.error('保存拆分配置失败', err);
      return false;
    }
  }

  getConfig(forceReload = false) {
    const config = this.loadMergedConfig(forceReload);
    if (!config) {
      console.warn('[Config] 获取配置失败，返回空配置');
      return {};
    }
    return config;
  }

  setConfig(configData) {
    return this.saveSplitConfig(configData);
  }

  // 样本示例
  createDefaultConfig() {
    const defaultConfig = {
      插件网址: "/yz/v3/mcqq",
      插件端口: 1314,
      命令前缀: "/",
      服转群: "说",
      群转服: "表示",
      服务器配置: [
        {
          服务器名称: "default_server",
          前缀: "a",
          rcon网址: "",
          rcon端口: "",
          rcon密码: "password",
          指令列表: ["list"]
        }
      ],
      群组配置: [
        {
          群号: "default_group",
          群名称: "默认",
          前缀: "a",
          显示群名: "是",
          同步服务器的所有消息: "是",
          开关服通知: ["server"],
          玩家登入通知: ["server"],
          玩家登出通知: ["server"],
          玩家死亡通知: ["server"],
          玩家成就通知: ["server"],
          玩家聊天通知: ["server"],
          玩家命令通知: ["server"]
        }
      ],
      信息违禁词: [
        "傻逼", "脑残", "操你妈", "fuck", "shit", "妈的", "草泥马", "cnm"
      ],
      违禁词替换: "表达了情绪",
      玩家数据: []
    };
    
    try {
      Path.ensureDirectoryExists(this.configDir);
      
      const samplePath = path.join(this.configDir, '配置样本.yaml');
      Cache.immediateWrite('配置样本.yaml', defaultConfig);
      console.log('[Config] 已创建默认配置样本');
      
      return defaultConfig;
    } catch (error) {
      console.error('[Config] 创建默认配置样本失败:', error);
      return defaultConfig;
    }
  }

  // 创建样本
  getDefConfig() {
    try {
      const configSample = Cache.readFile('配置样本.yaml');
      
      if (!configSample) {
        console.log('[Config] 默认设置文件不存在，正在创建...');
        return this.createDefaultConfig();
      }
      
      return configSample;
    } catch (err) {
      console.error('读取配置样本文件失败', err);
      return this.createDefaultConfig();
    }
  }

  initConfig() {
    try {
      if (this._initialized && this._cachedConfig) {
        console.log('[Config] 配置已初始化，跳过初始化流程');
        return true;
      }

      if (!Path.ensureDirectoryExists(this.configDir)) {
        console.error('[Config] 配置目录创建失败');
        return false;
      }

      const configFiles = ['1插件.yml', '2群组.yaml', '3服务器.yml', '4违禁词.yml'];
      let allFilesExist = true;
      
      for (const file of configFiles) {
        const fileData = Cache.readFile(file);
        if (!fileData || Object.keys(fileData).length === 0) {
          allFilesExist = false;
          console.warn(`[Config] 配置文件不存在或为空: ${file}`);
          break;
        }
      }
      
      if (!allFilesExist) {
        console.log('[Config] 检测到拆分配置文件不存在，将从样本创建');
        const defaultConfig = this.getDefConfig();
        const createResult = this.saveSplitConfig(defaultConfig);
        if (createResult) {
          this._initialized = true;
          console.log('[Config] 配置初始化完成');
        }
        return createResult;
      }

      const syncResult = this.syncConfig();
      if (syncResult) {
        this._initialized = true;
      } else {
        console.error('[Config] 配置同步失败');
      }
      return syncResult;
    } catch (err) {
      console.error('初始化配置失败', err);
      return false;
    }
  }

  // 初始化配置文件
  syncConfig() {
    try {
      const defaultConfig = this.getDefConfig();
      const userConfig = this.getConfig();
      
      if (!defaultConfig || !userConfig) {
        console.error('[Config] 同步配置失败：默认配置或用户配置为空');
        return false;
      }
      
      let hasChanges = false;
      const mergedConfig = { ...userConfig };
      const baseConfigKeys = ['插件网址', '插件端口', '命令前缀', '服转群', '群转服'];
      for (const key of baseConfigKeys) {
        if (mergedConfig[key] === undefined || mergedConfig[key] === null || mergedConfig[key] === '') {
          if (defaultConfig[key] !== undefined) {
            mergedConfig[key] = defaultConfig[key];
            hasChanges = true;
            console.log(`[Config] 添加缺失的基础配置: ${key}`);
          }
        }
      }
      
      if (!mergedConfig.服务器配置 || !Array.isArray(mergedConfig.服务器配置)) {
        if (defaultConfig.服务器配置 && Array.isArray(defaultConfig.服务器配置)) {
          mergedConfig.服务器配置 = defaultConfig.服务器配置;
          hasChanges = true;
          console.log('[Config] 添加服务器配置');
        }
      }
      
      if (!mergedConfig.群组配置 || !Array.isArray(mergedConfig.群组配置)) {
        if (defaultConfig.群组配置 && Array.isArray(defaultConfig.群组配置)) {
          mergedConfig.群组配置 = defaultConfig.群组配置;
          hasChanges = true;
          console.log('[Config] 添加群组配置');
        }
      }
      
      if (!mergedConfig.信息违禁词) {
        if (defaultConfig.信息违禁词) {
          mergedConfig.信息违禁词 = defaultConfig.信息违禁词;
          hasChanges = true;
          console.log('[Config] 添加违禁词配置');
        }
      }
      if (!mergedConfig.违禁词替换) {
        if (defaultConfig.违禁词替换) {
          mergedConfig.违禁词替换 = defaultConfig.违禁词替换;
          hasChanges = true;
          console.log('[Config] 添加违禁词替换文本');
        }
      }
      
      if (!mergedConfig.玩家数据 || typeof mergedConfig.玩家数据 !== 'object') {
        mergedConfig.玩家数据 = defaultConfig.玩家数据 || {};
        hasChanges = true;
        console.log('[Config] 初始化玩家数据配置');
      }
      
      if (hasChanges) {
        console.log('[Config] 配置有变更，正在保存...');
        const result = this.setConfig(mergedConfig);
        console.log('[Config] 配置同步完成');
        return result;
      } else {
        console.log('[Config] 配置完整，无需同步');
        return true;
      }
    } catch (err) {
      console.error('同步配置失败', err);
      return false;
    }
  }

  // 对比更新
  validateConfig(config) {
    const errors = [];
    
    if (typeof config.插件端口 !== 'number' || config.插件端口 < 1 || config.插件端口 > 65535) {
      errors.push('插件端口必须是1-65535之间的数字');
    }
    if (typeof config.插件网址 !== 'string' || !config.插件网址.startsWith('/')) {
      errors.push('插件网址必须以/开头');
    }
    if (typeof config.命令前缀 !== 'string' || config.命令前缀.length === 0) {
      errors.push('命令前缀不能为空');
    }
    
    if (Array.isArray(config.服务器配置)) {
      config.服务器配置.forEach((server, index) => {
        if (!server.服务器名称) {
          errors.push(`服务器配置 ${index}: 服务器名称 不能为空`);
        }
        if (server.rcon网址 && (server.rcon端口 === null || server.rcon端口 === undefined)) {
          errors.push(`服务器 ${server.服务器名称}: 设置了rcon网址必须设置rcon端口`);
        }
      });
    }
    
    if (config.群组配置 && config.群组配置.length > 0) {
      const defaultGroup = config.群组配置.find(group => group.群号 === 'default_group');
      if (defaultGroup) {
        const requiredGroupFields = ['群名称', '前缀', '显示群名'];
        requiredGroupFields.forEach(field => {
          if (defaultGroup[field] === undefined) {
            errors.push(`默认群组配置缺少必需字段: ${field}`);
          }
        });
      }
    }
    
    if (config.信息违禁词 && !Array.isArray(config.信息违禁词)) {
      errors.push('信息违禁词配置必须是数组格式');
    }
    
    if (config.玩家数据 && !Array.isArray(config.玩家数据)) {
      errors.push('玩家数据配置必须是数组格式');
    }
    
    if (errors.length > 0) {
      console.warn('[Config] 配置验证错误:', errors);
    } else {
      console.log('[Config] 配置验证通过');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // 强制更新
  forceUpdateCache(newConfig) {
    this._cachedConfig = newConfig;
    this._lastValidConfig = newConfig;
    console.log('[Config] 缓存已强制更新');
  }

  // 写入更新
  getStats() {
    const config = this.getConfig();
    return {
      serverCount: config.服务器配置 ? config.服务器配置.length : 0,  
      groupCount: config.群组配置 ? config.群组配置.length : 0, 
      bannedWordsCount: config.信息违禁词 ? config.信息违禁词.length : 0,
      wsPort: config.插件端口,
      wsUrl: config.插件网址,
      cacheStatus: Cache.getStatus()
    };
  }

  // 清除加载
  clearCache() {
    this._cachedConfig = null;
    this._initialized = false;
    console.log('[Config] 缓存已清除');
  }

  isInitialized() {
    return this._initialized && this._cachedConfig !== null;
  }

  getStatus() {
    const config = this.getConfig();
    return {
      initialized: this._initialized,
      hasCachedConfig: this._cachedConfig !== null,
      hasLastValidConfig: this._lastValidConfig !== null,
      config: {
        serverCount: config.服务器配置?.length || 0,
        groupCount: config.群组配置?.length || 0,
        bannedWordsCount: config.信息违禁词?.length || 0
      },
      cacheStatus: Cache.getStatus()
    };
  }

  // 强制刷新
  async forceFlush() {
    console.log('[Config] 强制刷新所有配置写入');
    await Cache.forceFlush();
  }
}

export default new Config();