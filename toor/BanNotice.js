import Config from './Config.js'
import Log from './logs.js'

class BanNotice {
  constructor() {
    this.cachedConfig = null;
    this.lastReloadTime = 0
    this.reloadInterval = 30000;
  }

  getConfig() {
    const now = Date.now();
    
    if (!this.cachedConfig || (now - this.lastReloadTime) > this.reloadInterval) {
      this.cachedConfig = Config.getConfig(false); 
      this.lastReloadTime = now;
     }
    
    return this.cachedConfig;
  }

  //重新加载配置
  reloadConfig() {
    Log.i('[BanNotice] 重新加载违禁词配置');
    this.cachedConfig = null;
    this.lastReloadTime = 0;
    return this.getConfig();
  }

  // 检测并替换文本中的违禁词
  filterText(text) {
    const config = this.getConfig();
    
    if (!config || !config.信息违禁词 || !Array.isArray(config.信息违禁词) || config.信息违禁词.length === 0) {
      return text;
    }
    
    let filteredText = text;
    const replaceText = config.违禁词替换 || "感到生气";
    let replacedCount = 0;
    
    config.信息违禁词.forEach(word => {
      if (word && typeof word === 'string') {
        const regex = new RegExp(this.escapeRegExp(word), 'gi');
        const matches = filteredText.match(regex);
        if (matches) {
          replacedCount += matches.length;
          filteredText = filteredText.replace(regex, replaceText);
        }
      }
    });
    
    if (replacedCount > 0) {
      Log.i(`[MC_QQ]丨检测到违禁词，已替换 ${replacedCount} 处，替换为"${replaceText}"`);
    }
    
    return filteredText;
  }

  getStats() {
    const config = this.getConfig();
    return {
      wordCount: config?.信息违禁词?.length || 0,
      replaceText: config?.违禁词替换 || "感到生气",
      lastReloadTime: this.lastReloadTime
    };
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// 导出单例实例
export default new BanNotice();