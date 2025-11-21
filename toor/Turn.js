// Turn.js
class Turn {
  constructor() {
    // 生物射表
    this.mobNames = {
      'Zombie': '僵尸',
      'Skeleton': '骷髅',
      'Creeper': '苦力怕',
      'Spider': '蜘蛛',
      'Enderman': '末影人',
      'Witch': '女巫',
      'Blaze': '烈焰人',
      'Wither Skeleton': '凋零骷髅',
      'Ender Dragon': '末影龙',
      'Wither': '凋灵',
      'Zombie Villager': '僵尸村民',
      'Iron Golem': '铁傀儡',
      'Snow Golem': '雪傀儡',
      'Piglin': '猪灵',
      'Hoglin': '疣猪兽',
      'Piglin Brute': '猪灵蛮兵',
      'Zoglin': '僵尸疣猪兽',
      'Phantom': '幻翼',
      'Ravager': '劫掠兽',
      'Vex': '恼鬼',
      'Evoker': '唤魔者',
      'Vindicator': '卫道士',
      'Pillager': '掠夺者',
      'Shulker': '潜影贝',
      'Guardian': '守卫者',
      'Elder Guardian': '远古守卫者',
      'Drowned': '溺尸',
      'Husk': '尸壳',
      'Stray': '流浪者',
      'Cave Spider': '洞穴蜘蛛'
    };
  
    // 死亡映射
    this.deathMessages = {
      // 摔落相关
      'fell from a high place': '从高处摔了下来',
      'fell off a ladder': '从梯子上摔了下来',
      'fell off some vines': '从藤蔓上摔了下来',
      'fell off some weeping vines': '从垂泪藤上摔了下来',
      'fell off some twisting vines': '从缠怨藤上摔了下来',
      'fell off scaffolding': '从脚手架上摔了下来',
      'fell while climbing': '在攀爬时摔了下来',
      'was doomed to fall': '注定要坠落',
      'was doomed to fall by': '被注定要坠落',
      'was blown from a high place by': '被从高处吹落',
  
      // 熔岩相关
      'tried to swim in lava': '试图在熔岩中游泳',
      'tried to swim in lava while trying to escape': '在逃跑时试图在熔岩中游泳',
      'was boiled alive in lava': '在熔岩中被活活煮死',
      'walked into lava whilst trying to escape': '在逃跑时走入熔岩',
      'discovered the floor was lava': '发现地板是熔岩',
  
      // 特殊战斗相关）
      'was shot off some vines by': '在藤蔓上被射下',
      'was shot off some weeping vines by': '在垂泪藤上被射下',
      'was shot off some twisting vines by': '在缠怨藤上被射下',
      'was shot off a ladder by': '在梯子上被射下',
      'was shot off scaffolding by': '在脚手架上被射下',
      'was poked to death by a sweet berry bush': '被甜浆果丛刺死',
      'was stabbed to death by a sweet berry bush': '被甜浆果丛刺死',
      'walked into a cactus whilst trying to escape': '在逃跑时撞上了仙人掌',
      'was fireballed by': '被火球击中',
      'was killed trying to hurt': '在试图伤害时被反杀',
  
      // 特殊生物击杀
      'was slain by Creeper': '被苦力怕炸死了',
      'was stung to death': '被蛰死了',
      'was shot by a skull from': '被射中头颅了',
  
      // 爆炸相关
      'was blown up by Creeper': '被苦力怕炸死了',
      'was blown up by': '被炸死了',
      'blew up': '爆炸了',
      'was killed by an explosion': '被爆炸杀死了',
  
      // 火焰相关
      'went up in flames': '着火了',
      'burned to death': '被烧死了',
      'was burned to a crisp':'被烤的酥脆',
      'was burnt to a crisp whilst fighting': '在战斗时被烧成灰烬',
      'walked into fire whilst fighting': '在战斗时走入火中',
      'was struck by lightning': '被闪电击中',
      'was struck by lightning whilst fighting': '在战斗时被闪电击中',
  
      // 溺水相关
      'drowned': '溺水了',
      'drowned whilst trying to escape': '在逃跑时溺水身亡',
  
      // 窒息相关
      'suffocated in a wall': '在墙里窒息',
      'was squished too much': '被压得太扁了',
      'was squashed by': '被压扁',
  
      // 饥饿相关
      'starved to death': '饿死了',
  
      // 凋零相关
      'withered away': '凋零了',
  
      // 冰冻相关
      'froze to death': '冻死了',
  
      // 魔法相关
      'was killed by magic': '被魔法杀死',
      'was killed by even more magic': '被更多魔法杀死',
      'using magic': '使用魔法杀死',
  
      // 其他
      'didn\'t want to live in the same world as': '不想和生活在同一个世界',
      'was pricked to death': '被刺死',
      'was impaled by': '被刺穿',
      'was skewered by': '被串刺',
      'was pummeled by': '被痛击',
      'died': '死了',
      'experienced kinetic energy': '体验了动能',
      'removed an elytra while flying': '在飞行时卸下了鞘翅',
      'didn\'t bounce': '没有弹起来',
      'fell out of the world': '掉出了世界',
      'was squashed by a falling anvil': '被下落的铁砧压扁',
      'was squashed by a falling block': '被下落的方块压扁',
  
      // 守卫者相关
      'was shot by a guardian': '被守卫者射中',
  
      // 末影龙相关
      'was obliterated by a sonically-charged shout': '被龙息 obliterated'
    };
  
    // 命令映射
    this.commandResponses = {
      'There are': '当前在线',
      'of a max of': '/',
      'players online': '名玩家在线',
      'list': '玩家列表',
      'Unknown command': '未知命令',
      'No player was found': '未找到玩家',
      'You do not have permission to use this command': '你没有权限使用此命令',
      'That player is not online': '该玩家不在线',
      'Player not found': '玩家未找到',
      'No targets matched selector': '选择器未匹配到目标',
      'Cannot execute commands': '无法执行命令',
      'Command blocked': '命令被阻止',
      'Invalid argument': '无效参数',
      'Syntax error': '语法错误',
      'Expected whitespace': '需要空格',
      'Expected end of line': '需要行尾',
      'Incorrect argument for command': '命令参数不正确',
      'Entity not found': '实体未找到',
      'Block not found': '方块未找到',
      'Item not found': '物品未找到',
      'No entity was found': '未找到实体',
      'No block was found': '未找到方块',
      'No item was found': '未找到物品',
      'Position out of world': '位置超出世界范围',
      'Value is too small': '值太小',
      'Value is too big': '值太大',
      'No gamemode specified': '未指定游戏模式',
      'No such item': '没有此物品',
      'No such enchantment': '没有此附魔',
      'No such entity': '没有此实体',
      'No such player': '没有此玩家',
      'No such team': '没有此队伍',
      'No such objective': '没有此目标',
      'No such scoreboard criteria': '没有此记分板标准',
      'No such world': '没有此世界',
      'Teleporting': '传送中',
      'Teleported': '已传送',
      'Gamemode set to': '游戏模式设置为',
      'Time set to': '时间设置为',
      'Weather set to': '天气设置为',
      'Gave': '给予',
      'Cleared the inventory of': '清空了库存',
      'Killed': '杀死了',
      'Summoned new': '召唤了新的',
      'Set the time to': '设置时间为',
      'Set the weather to': '设置天气为',
      'clear': '清空',
      'give': '给予',
      'tp': '传送',
      'teleport': '传送',
      'gamemode': '游戏模式',
      'time': '时间',
      'weather': '天气',
      'kill': '杀死',
      'summon': '召唤',
      'effect': '效果',
      'enchant': '附魔',
      'xp': '经验',
      'experience': '经验',
      'msg': '私信',
      'tell': '告诉',
      'whisper': '私语',
      'say': '说',
      'me': '我',
      'ban': '封禁',
      'pardon': '解封',
      'kick': '踢出',
      'op': '管理员',
      'deop': '取消管理员',
      'stop': '停止',
      'save': '保存',
      'save-all': '保存全部',
      'save-off': '关闭保存',
      'save-on': '开启保存',
      'banlist': '封禁列表',
      'whitelist': '白名单',
      'reload': '重载',
      'restart': '重启',
      'help': '帮助',
      '?': '？',
      'Survival': '生存模式',
      'Creative': '创造模式',
      'Adventure': '冒险模式',
      'Spectator': '旁观模式',
      'clear': '晴天',
      'rain': '雨天',
      'thunder': '雷雨',
      'day': '白天',
      'night': '夜晚',
      'noon': '正午',
      'midnight': '午夜',
      'sunrise': '日出',
      'sunset': '日落',
      'Added': '已添加',
      'Removed': '已移除',
      'Enabled': '已启用',
      'Disabled': '已禁用',
      'ON': '开启',
      'OFF': '关闭',
      'true': '是',
      'false': '否',
      'yes': '是',
      'no': '否',
      'success': '成功',
      'failed': '失败',
      'error': '错误',
      'warning': '警告',
      'info': '信息',
      'debug': '调试',
      'Loading': '加载中',
      'Saving': '保存中',
      'Processing': '处理中',
      'Completed': '已完成',
      'Starting': '启动中',
      'Stopping': '停止中',
      'Restarting': '重启中',
      'Connecting': '连接中',
      'Disconnected': '已断开连接',
      'Connected': '已连接',
      'Waiting': '等待中',
      'Ready': '准备就绪',
      'Busy': '忙碌中',
      'Idle': '空闲中',
      'Active': '活跃中',
      'Inactive': '非活跃',
      'Online': '在线',
      'Offline': '离线',
      'Available': '可用',
      'Unavailable': '不可用',
      'Full': '已满',
      'Empty': '空',
      'Locked': '已锁定',
      'Unlocked': '已解锁',
      'Allowed': '允许',
      'Denied': '拒绝',
      'Permitted': '许可',
      'Forbidden': '禁止',
      'Valid': '有效',
      'Invalid': '无效',
      'Correct': '正确',
      'Incorrect': '不正确',
      'Match': '匹配',
      'Mismatch': '不匹配',
      'Found': '找到',
      'NotFound': '未找到',
      'Exists': '存在',
      'NotExists': '不存在'
    };
  
    // 成就/进度映射
    this.advancements = {
      'Whatever Floats Your Goat!': '山羊漂流记！',
      'Voluntary Exile': '自愿放逐',
      'Uneasy Alliance': '不安的联盟',
      'Monsters Hunted': '怪物猎人',
      'Adventuring Time': '冒险时间',
      'Sweet Dreams': '甜美的梦',
      'Hero of the Village': '村庄英雄',
      'The End?': '结束了？',
      'The End.': '结束了。',
      'Into Fire': '与火共舞',
      'Free the End': '解放末地',
      'A Seedy Place': '种子之地',
      'A Terrible Fortress': '阴森的要塞',
      'Acquire Hardware': '获得硬件',
      'Arbalistic': '弩箭大师',
      'Bee Our Guest': '蜜蜂我们的客人',
      'Cover Me in Debris': '用残骸覆盖我',
      'Eye Spy': '眼睛间谍',
      'Feeling Ill': '感觉不适',
      'Fishy Business': '可疑的交易',
      'Hot Tourist Destinations': '热门旅游目的地',
      'Local Brewery': '当地酿酒厂',
      'Monster Hunter': '怪物猎人',
      'Ol\' Betsy': '老贝特西',
      'Postmortal': '死后',
      'Sticky Situation': '粘性情况',
      'Suit Up': '穿上装备',
      'This Boat Has Legs': '这船有腿',
      'Total Beelocation': '完全蜜蜂定位',
      'Two Birds, One Arrow': '两鸟一箭',
      'Very Very Frightening': '非常非常可怕',
      'Who is Cutting Onions?': '谁在切洋葱？',
      'Zombie Doctor': '僵尸医生',
      'Stone Age': '石器时代',
      'Getting an Upgrade': '获得升级',
      'Hot Topic': '热门话题',
      'Isn\'t It Iron Pick': '这不是铁镐吗',
      'Not Today, Thank You': '今天不行，谢谢',
      'Ice Bucket Challenge': '冰桶挑战',
      'Diamonds!': '钻石！',
      'We Need to Go Deeper': '我们需要更深入',
      'Diamonds to you!': '钻石给你！',
      'Enchanter': '附魔师',
      'A Furious Cocktail': '愤怒的鸡尾酒',
      'How Did We Get Here?': '我们怎么到这里了？',
      'A Balanced Diet': '均衡饮食',
      'Whos the Pillager Now?': '现在谁是掠夺者？',
      'Sound of Music': '音乐之声',
      'Birthday Song': '生日歌',
      'You Need a Mint': '你需要薄荷糖',
      'The Healing Power of Friendship!': '友谊的治愈力量！',
      'With Our Powers Combined!': '结合我们的力量！',
      'It Spreads': '它在传播',
      'Sneak 100': '潜行100',
      'Camouflage': '伪装',
      'Smells Interesting': '闻起来很有趣',
      'Glow and Behold!': '发光吧！',
      'Light as a Rabbit': '轻如兔子',
      'Tactical Fishing': '战术钓鱼',
      'The Cutest Predator': '最可爱的捕食者',
      'The Parrots and the Bats': '鹦鹉和蝙蝠',
      'Two by Two': '成双成对',
      'A Complete Catalogue': '完整目录',
      'A Throwaway Joke': '随口玩笑',
      'Sniper Duel': '狙击对决',
      'Bullseye': '靶心',
      'Oh Shiny': '哦，闪亮的',
      'Return to Sender': '退回寄件人',
      'Not Quite "Nine" Lives': '不完全是"九"条命',
      'Spooky Scary Skeleton': '可怕的骷髅',
      'Creepy Crawly': 'creepy爬行',
      'The Monster Hunter': '怪物猎人',
      'They\'re Multiplying!': '它们在繁殖！',
      'Hired Help': '雇佣帮手',
      'Star Trader': '星星商人',
      'Great View From Up Here': '从这里看风景很棒',
      'Caves & Cliffs': '洞穴与悬崖',
      'Is It a Bird?': '是鸟吗？',
      'Is It a Balloon?': '是气球吗？',
      'Is It a Plane?': '是飞机吗？',
      'Sky\'s the Limit': '天空是极限',
      'Super Sonic': '超音速',
      'So I Got That Going for Me': '所以我得到了那个',
      'Withering Heights': '凋零高地',
      'The Beginning?': '开始？',
      'The Beginning.': '开始。',
      'The City at the End of the Game': '游戏末端的城市',
      'The Next Generation': '下一代',
      'The Power of Books': '书籍的力量',
      'Librarian': '图书管理员',
      'What a Deal!': '多好的交易！',
      'It\'s a Sign!': '这是个标志！',
      'Disenchanted': '解除附魔',
      'Serious Dedication': '认真奉献',
      'Wax On': '打蜡',
      'Wax Off': '除蜡',
      'Who\'s the Pillager Now?': '现在谁是掠夺者？'
    };
  }
  
    // 被击杀播报
    translateDeath(message) {
      let translated = message;
      
      // 战斗自杀
      if (message.includes('whilst fighting')) {
        const fightMatch = message.match(/(.+?) (.+?) whilst fighting (.+)/);
        if (fightMatch) {
          const [, victim, deathAction, killer] = fightMatch;
          let actionChinese = this.deathMessages[deathAction];
          if (!actionChinese) {
            for (const [english, chinese] of Object.entries(this.deathMessages)) {
              if (deathAction.includes(english)) {
                actionChinese = chinese;
                break;
              }
            }
            if (!actionChinese) actionChinese = deathAction;
          }
          const victimChinese = this.cleanFormatCodes(victim);
          let killerChinese = this.cleanFormatCodes(killer);
          if (this.mobNames[killerChinese]) {
            killerChinese = this.mobNames[killerChinese];
          }
          
          return `${victimChinese}在与${killerChinese}战斗时${actionChinese}`;
        }
      }
    // 指令自杀
    if (message.endsWith('was killed') && !message.includes('by')) {
      const player = message.replace(' was killed', '').trim();
      return `${player} 自杀身亡`;
    }
    // 正常死亡
    for (const [english, chinese] of Object.entries(this.deathMessages)) {
      if (message.includes(english)) {
        translated = message.replace(english, chinese);
        for (const [mobEnglish, mobChinese] of Object.entries(this.mobNames)) {
          if (translated.includes(mobEnglish)) {
            translated = translated.replace(mobEnglish, mobChinese);
          }
        }
        return translated;
      }
    }
    // 玩家击杀
    if ((message.includes('was shot by') || message.includes('was slain by') || message.includes('was killed by')) && message.includes(' by ')) {
      let english, action;
      
      if (message.includes('was shot by')) {
        english = 'was shot by';
        action = '射杀';
      } else if (message.includes('was slain by')) {
        english = 'was slain by';
        action = '杀死了';
      } else if (message.includes('was killed by')) {
        english = 'was killed by';
        action = '斩杀';
      }
      
      const parts = message.split(english);
      const victim = parts[0].trim();
      const rest = parts[1];
      
      if (rest) {
        let killer = rest.trim();
        
        if (killer.includes(' using ')) {
          const [killerName, weapon] = killer.split(' using ');
          let cleanWeapon = this.cleanFormatCodes(weapon);
          killer = killerName.trim();
          killer = this.cleanFormatCodes(killer);
        
        if (this.mobNames[killer]) {
          killer = this.mobNames[killer];
        } 
        return `${victim}被${killer}使用[${cleanWeapon}]${action}`;
      } else {
        killer = this.cleanFormatCodes(killer);
        
        if (this.mobNames[killer]) {
          killer = this.mobNames[killer];
        } 
        return `${victim}被${killer}${action}`;
      }
    }
    }
    
    return translated;
    }

    // 清理Mc颜文字
    cleanFormatCodes(text) {
      if (!text) return text;
      let cleaned = text.replace(/§[0-9a-fk-or]/g, '');
      cleaned = cleaned.replace(/[§【】]/g, '');
      cleaned = cleaned.replace(/\[(.*?)\]/g, '$1');
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      return cleaned;
    }

    // 翻译命令返回
    translateCommand(response) {
      let translated = response;
      if (response.includes('There are') && response.includes('players online')) {
        translated = translated.replace('There are', '当前在线')
                             .replace('of a max of', '/')
                             .replace('players online', '名玩家在线');
      }
      for (const [english, chinese] of Object.entries(this.commandResponses)) {
        translated = translated.split(english).join(chinese);
      }
        
      return translated;
    }
  
    // 翻译成就/进度
    translateAdvancement(advancement) {
      for (const [english, chinese] of Object.entries(this.advancements)) {
        if (advancement.includes(english)) {
          return advancement.replace(english, chinese);
        }
      }
      return advancement;
    }
  
    // 通用翻译方法
    translate(text, type = 'auto') {
      if (!text) return text;
      
      switch (type) {
        case 'death':
          return this.translateDeath(text);
        case 'command':
          return this.translateCommand(text);
        case 'advancement':
          return this.translateAdvancement(text);
        case 'auto':
          // 自动检测类型
          if (text.includes('fell') || text.includes('was killed') || text.includes('died') || text.includes('slain')) {
            return this.translateDeath(text);
          } else if (text.includes('There are') || text.includes('players online')) {
            return this.translateCommand(text);
          } else {
            return text;
          }
        default:
          return text;
      }
    }
  
    // 添加自定义翻译规则
    addTranslationRule(english, chinese, category = 'custom') {
      if (!this[category]) {
        this[category] = {};
      }
      this[category][english] = chinese;
    }
  
    // 获取翻译统计
    getStats() {
      return {
        deathMessages: Object.keys(this.deathMessages).length,
        commandResponses: Object.keys(this.commandResponses).length,
        advancements: Object.keys(this.advancements).length
      };
    }
  }
  
  export default new Turn();