import Config from "./toor/Config.js";
import lodash from "lodash";
import path from "path";
import { fileURLToPath } from 'url';

// 动态计算插件根目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.join(__dirname, '../');


export function supportGuoba() {
  return {
    
    pluginInfo: {
      name: 'Mcbot-plugin',
      title: '我的世界通讯插件',
      author: ['@小奇'],
      authorLink: ['https://github.com/TaXiaoQi'],
      link: 'https://github.com/TaXiaoQi/mcbot-plugin',
      isV3: true,
      isV2: false,
      showInMenu: true,
      description: '基于 Yunzai 的 Minecraft 消息互通插件',
      icon: 'noto:video-game',
      iconColor: '#1bb61e',
      iconPath: path.join(pluginRoot, 'resources/readme/girl.png'),
    },

    /**
     * 配置表单定义 - 适配你的实际配置结构
     */
    configInfo: {
      schemas: [
        // ==================== WebSocket 基础配置 ====================
        {
          component: "Divider",
          label: "WebSocket 基础配置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "插件端口",
          label: "WebSocket端口",
          bottomHelpMessage: "WebSocket 服务监听端口",
          component: "InputNumber",
          componentProps: {
            placeholder: '例：1314',
            min: 1,
            max: 65535,
            step: 1,
          },
        },
        {
          field: "插件网址",
          label: "WebSocket路由",
          bottomHelpMessage: "WebSocket 服务路径",
          component: "Input",
          componentProps: {
            placeholder: '例：/yz/v3/mcqq',
          },
        },

        // ==================== 消息格式配置 ====================
        {
          component: "Divider",
          label: "消息格式配置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "命令前缀",
          label: "命令前缀",
          bottomHelpMessage: "MC命令前缀",
          component: "Input",
          componentProps: {
            placeholder: '例：/',
          },
        },
        {
          field: "服转群",
          label: "服转群修饰词",
          bottomHelpMessage: "服务器消息转发到QQ群的修饰词",
          component: "Input",
          componentProps: {
            placeholder: '例：说',
          },
        },
        {
          field: "群转服",
          label: "群转服修饰词",
          bottomHelpMessage: "QQ群消息转发到服务器的修饰词",
          component: "Input",
          componentProps: {
            placeholder: '例：表示',
          },
        },

        // ==================== 服务器配置 ====================
        {
          component: "Divider",
          label: "服务器配置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "服务器配置",
          label: "服务器列表",
          bottomHelpMessage: "配置多个Minecraft服务器",
          component: "GSubForm",
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: "服务器名称",
                label: "服务器名称",
                bottomHelpMessage: "服务器唯一标识名称",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '需要与MC端配置一致',
                },
              },
              {
                field: "前缀",
                label: "消息前缀",
                bottomHelpMessage: "该服务器消息的前缀标识",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '例：a',
                },
              },
              {
                component: "Divider",
                label: "RCON 配置",
                componentProps: {
                  orientation: "left",
                  plain: true,
                },
              },
              {
                field: "rcon网址",
                label: "RCON地址",
                bottomHelpMessage: "Minecraft服务器RCON地址",
                component: "Input",
                componentProps: {
                  placeholder: '例：127.0.0.1',
                },
              },
              {
                field: "rcon端口",
                label: "RCON端口",
                bottomHelpMessage: "Minecraft服务器RCON端口",
                component: "InputNumber",
                componentProps: {
                  placeholder: '例：25575',
                  min: 1,
                  max: 65535,
                  step: 1,
                },
              },
              {
                field: "rcon密码",
                label: "RCON密码",
                bottomHelpMessage: "RCON连接密码",
                component: "InputPassword",
                componentProps: {
                  placeholder: '与server.properties中的rcon.password一致',
                  visible: false,
                },
              },
              {
                field: "指令列表",
                label: "允许的指令列表",
                bottomHelpMessage: "普通用户可执行的指令列表",
                component: "GTags",
                componentProps: {
                  placeholder: '请输入允许的指令',
                  allowAdd: true,
                  allowDel: true,
                  showPrompt: true,
                  promptProps: {
                    content: '添加允许的指令',
                    placeholder: '例：list, time set day',
                    okText: '添加',
                    rules: [
                      { required: false, message: '指令不能为空' },
                    ],
                  },
                  valueParser: ((value) => {
                    if (Array.isArray(value)) return value;
                    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(s => s);
                    return [];
                  }),
                },
              },
            ],
          },
        },

        // ==================== 群组配置 ====================
        {
          component: "Divider",
          label: "群组配置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "群组配置",
          label: "QQ群组列表",
          bottomHelpMessage: "配置需要同步消息的QQ群",
          component: "GSubForm",
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: "群号",
                label: "群号",
                bottomHelpMessage: "QQ群号码",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '例：123456789',
                },
              },
              {
                field: "群名称",
                label: "群名称",
                bottomHelpMessage: "群显示名称",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '例：我的世界交流群',
                },
              },
              {
                field: "前缀",
                label: "消息前缀",
                bottomHelpMessage: "该群消息的前缀标识",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '例：a',
                },
              },
              {
                field: "显示群名",
                label: "显示群名",
                bottomHelpMessage: "是否在MC中显示群名称",
                component: "Select",
                componentProps: {
                  options: [
                    { label: '是', value: '是' },
                    { label: '否', value: '否' },
                  ],
                },
              },
              {
                field: "同步服务器的所有消息",
                label: "同步所有消息",
                bottomHelpMessage: "是否同步该服务器的所有消息",
                component: "Select",
                componentProps: {
                  options: [
                    { label: '是', value: '是' },
                    { label: '否', value: '否' },
                  ],
                },
              },
              {
                component: "Divider",
                label: "消息通知设置",
                componentProps: {
                  orientation: "left",
                  plain: true,
                },
              },
              {
                field: "开关服通知",
                label: "开关服通知",
                bottomHelpMessage: "接收开关服通知的服务器列表",
                component: "GTags",
                componentProps: {
                  placeholder: '输入服务器名称',
                  allowAdd: true,
                  allowDel: true,
                  showPrompt: true,
                  promptProps: {
                    content: '添加服务器名称',
                    placeholder: '例：生存服',
                    okText: '添加',
                  },
                  valueParser: ((value) => {
                    if (Array.isArray(value)) return value;
                    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(s => s);
                    return [];
                  }),
                },
              },
              {
                field: "玩家登入通知",
                label: "玩家登入通知",
                bottomHelpMessage: "接收玩家登入通知的服务器列表",
                component: "GTags",
                componentProps: {
                  placeholder: '输入服务器名称',
                  allowAdd: true,
                  allowDel: true,
                  showPrompt: true,
                  valueParser: ((value) => {
                    if (Array.isArray(value)) return value;
                    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(s => s);
                    return [];
                  }),
                },
              },
              {
                field: "玩家登出通知",
                label: "玩家登出通知",
                bottomHelpMessage: "接收玩家登出通知的服务器列表",
                component: "GTags",
                componentProps: {
                  placeholder: '输入服务器名称',
                  allowAdd: true,
                  allowDel: true,
                  showPrompt: true,
                  valueParser: ((value) => {
                    if (Array.isArray(value)) return value;
                    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(s => s);
                    return [];
                  }),
                },
              },
              {
                field: "玩家死亡通知",
                label: "玩家死亡通知",
                bottomHelpMessage: "接收玩家死亡通知的服务器列表",
                component: "GTags",
                componentProps: {
                  placeholder: '输入服务器名称',
                  allowAdd: true,
                  allowDel: true,
                  showPrompt: true,
                  valueParser: ((value) => {
                    if (Array.isArray(value)) return value;
                    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(s => s);
                    return [];
                  }),
                },
              },
              {
                field: "玩家成就通知",
                label: "玩家成就通知",
                bottomHelpMessage: "接收玩家成就通知的服务器列表",
                component: "GTags",
                componentProps: {
                  placeholder: '输入服务器名称',
                  allowAdd: true,
                  allowDel: true,
                  showPrompt: true,
                  valueParser: ((value) => {
                    if (Array.isArray(value)) return value;
                    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(s => s);
                    return [];
                  }),
                },
              },
              {
                field: "玩家聊天通知",
                label: "玩家聊天通知",
                bottomHelpMessage: "接收玩家聊天通知的服务器列表",
                component: "GTags",
                componentProps: {
                  placeholder: '输入服务器名称',
                  allowAdd: true,
                  allowDel: true,
                  showPrompt: true,
                  valueParser: ((value) => {
                    if (Array.isArray(value)) return value;
                    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(s => s);
                    return [];
                  }),
                },
              },
              {
                field: "玩家命令通知",
                label: "玩家命令通知",
                bottomHelpMessage: "接收玩家命令通知的服务器列表",
                component: "GTags",
                componentProps: {
                  placeholder: '输入服务器名称',
                  allowAdd: true,
                  allowDel: true,
                  showPrompt: true,
                  valueParser: ((value) => {
                    if (Array.isArray(value)) return value;
                    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(s => s);
                    return [];
                  }),
                },
              },
            ],
          },
        },

        // ==================== 违禁词配置 ====================
        {
          component: "Divider",
          label: "违禁词配置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "信息违禁词",
          label: "违禁词列表",
          bottomHelpMessage: "需要过滤的违禁词",
          component: "GTags",
          componentProps: {
            placeholder: '请输入违禁词',
            allowAdd: true,
            allowDel: true,
            showPrompt: true,
            promptProps: {
              content: '添加违禁词',
              placeholder: '例：傻逼',
              okText: '添加',
            },
            valueParser: ((value) => {
              if (Array.isArray(value)) return value;
              if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(s => s);
              return [];
            }),
          },
        },
        {
          field: "违禁词替换",
          label: "替换文本",
          bottomHelpMessage: "违禁词被替换成的文本",
          component: "Input",
          componentProps: {
            placeholder: '例：感到生气',
          },
        },
      ],

      /**
       * 获取配置数据
       */
      getConfigData() {
        let config = Config.getConfig()
        return config
      },

      /**
       * 保存配置数据
       */
      setConfigData(data, { Result }) {
        let config = {}
        
        // 使用lodash.set处理嵌套字段
        for (let [keyPath, value] of Object.entries(data)) {
          // 特殊处理数组字段，确保格式正确
          if (keyPath === '服务器配置' || keyPath === '群组配置') {
            if (Array.isArray(value)) {
              // 过滤掉空对象或无效配置
              value = value.filter(item => {
                if (keyPath === '服务器配置') {
                  return item && item.服务器名称 && item.服务器名称 !== '';
                } else if (keyPath === '群组配置') {
                  return item && item.群号 && item.群号 !== '';
                }
                return true;
              });
            }
          }
          lodash.set(config, keyPath, value)
        }
        
        // 合并新旧配置
        const currentConfig = Config.getConfig()
        config = lodash.merge({}, currentConfig, config)
        
        // 特殊处理服务器列表和群组列表（直接覆盖）
        if (data['服务器配置'] !== undefined) {
          config.服务器配置 = data['服务器配置']
        }
        if (data['群组配置'] !== undefined) {
          config.群组配置 = data['群组配置']
        }
        
        // 保存配置
        const saveResult = Config.setConfig(config)
        if (saveResult) {
          return Result.ok({}, '保存成功~')
        } else {
          return Result.error('保存失败，请查看控制台日志')
        }
      },
    },
  }
}