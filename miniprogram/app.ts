// app.ts
App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      wx.showToast({
        title: '基础库版本过低',
        icon: 'none'
      })
    } else {
      // 方式1：不指定 env，自动使用当前小程序关联的云环境
      // 推荐使用这种方式，避免环境ID配置错误
      wx.cloud.init({
        traceUser: true,
      })
      
      // 方式2：如果方式1不行，可以手动指定环境ID
      // 在微信开发者工具中：云开发 -> 设置 -> 环境设置 -> 复制环境ID
      // wx.cloud.init({
      //   env: 'your-env-id', // 替换为实际的云环境ID
      //   traceUser: true,
      // })
    }
  },
})