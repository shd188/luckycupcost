// index.ts
Page({
  data: {
    searchKeyword: '',
    productResults: [] as any[],
    materialResults: [] as any[],
    hasNoResult: false,
    isSearching: false
  },

  searchTimer: null as any, // 防抖定时器

  onLoad() {
    // 首页不加载数据，只显示搜索框
  },

  onUnload() {
    // 清除定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  },

  // 搜索输入
  onSearchInput(e: any) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    
    // 如果关键词为空，清空结果
    if (!keyword.trim()) {
      this.setData({
        productResults: [],
        materialResults: [],
        hasNoResult: false,
        isSearching: false
      });
      // 清除之前的定时器
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
        this.searchTimer = null;
      }
      return;
    }
    
    // 防抖处理：延迟500ms后执行搜索
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    
    this.searchTimer = setTimeout(() => {
      this.search(keyword);
    }, 500);
  },

  // 执行搜索（调用云函数）
  async search(keyword: string) {
    if (!keyword || !keyword.trim()) {
      return;
    }

    this.setData({ isSearching: true });

    try {
      wx.showLoading({
        title: '搜索中...',
        mask: true
      });

      const res = await wx.cloud.callFunction({
        name: 'search',
        data: {
          keyword: keyword.trim()
        }
      });

      wx.hideLoading();

      if (res.result && res.result.success) {
        const { products, materials } = res.result.data;
        this.setData({
          productResults: products || [],
          materialResults: materials || [],
          hasNoResult: (products || []).length === 0 && (materials || []).length === 0,
          isSearching: false
        });
      } else {
        wx.showToast({
          title: res.result?.message || '搜索失败',
          icon: 'none',
          duration: 2000
        });
        this.setData({
          productResults: [],
          materialResults: [],
          hasNoResult: true,
          isSearching: false
        });
      }
    } catch (error: any) {
      wx.hideLoading();
      console.error('搜索失败:', error);
      wx.showToast({
        title: '搜索失败，请稍后重试',
        icon: 'none',
        duration: 2000
      });
      this.setData({
        productResults: [],
        materialResults: [],
        hasNoResult: true,
        isSearching: false
      });
    }
  },

  // 跳转到产品详情
  goToProductDetail(e: any) {
    const product = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: `/pages/detail/detail?type=product&id=${product._id}`
    });
  },

  // 跳转到物料详情（使用dk_id）
  goToMaterialDetail(e: any) {
    const material = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: `/pages/detail/detail?type=material&id=${material.dk_id}`
    });
  }
});
