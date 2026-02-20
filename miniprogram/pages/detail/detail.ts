// detail.ts
import { Material, Product, MaterialsMap, buildMaterialsMap, calculateProductCost, calculateUnitPrice, CostInfo } from '../../utils/calculator'

Page({
  data: {
    type: '',              // 'product' 或 'material'
    product: null as Product | null,
    material: null as Material | null,
    costInfo: {            // 产品成本信息（包含总成本和明细）
      totalCost: 0,
      details: []
    } as CostInfo,
    unitPrice: 0,          // 物料单位成本
  },

  onLoad(options: any) {
    const { type, id } = options;
    this.setData({ type });
    
    if (type === 'product') {
      this.loadProductAndCalculateCost(id);
    } else if (type === 'material') {
      this.loadMaterial(id);
    }
  },

  // 加载产品并计算成本总数和明细
  loadProductAndCalculateCost(id: string) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    const db = wx.cloud.database();
    
    console.log('开始加载产品，id:', id);
    
    // 1. 查询产品
    db.collection('products')
      .doc(id)
      .get()
      .then(res => {
        const product = res.data as Product;
        
        console.log('产品数据加载成功:', {
          productName: product?.name,
          recipeLength: product?.recipe?.length || 0,
          recipe: product?.recipe
        });
        
        if (!product || !product.recipe || product.recipe.length === 0) {
          console.warn('产品没有recipe数据');
          // 如果没有recipe，设置空结果
          this.setData({
            product,
            costInfo: {
              totalCost: 0,
              details: []
            }
          });
          wx.hideLoading();
          return;
        }
        
        // 2. 提取所有需要的material_dk_id，确保转换为number类型
        const materialDkIds = product.recipe.map(item => {
          const dkId = item.material_dk_id;
          // 确保转换为number类型
          return typeof dkId === 'string' ? parseInt(dkId, 10) : Number(dkId);
        }).filter(id => !isNaN(id)); // 过滤掉无效的ID
        
        console.log('需要查询的物料dk_id列表:', materialDkIds, '类型:', materialDkIds.map(id => typeof id));
        
        // 3. 查询所有需要的物料
        this.loadMaterialsByIds(materialDkIds).then(materialsMap => {
          console.log('物料Map构建完成:', {
            mapSize: Object.keys(materialsMap).length,
            mapKeys: Object.keys(materialsMap),
            materials: Object.keys(materialsMap).map(k => ({
              dk_id: Number(k),
              name: materialsMap[Number(k)]?.name
            }))
          });
          
          // 4. 计算成本总数和明细
          const costInfo = calculateProductCost(product, materialsMap);
          
          console.log('成本计算完成:', {
            totalCost: costInfo.totalCost,
            detailsCount: costInfo.details.length,
            details: costInfo.details
          });
          
          // 5. 设置数据
          this.setData({
            product,
            costInfo
          });
          
          wx.hideLoading();
        }).catch(err => {
          wx.hideLoading();
          console.error('加载物料失败:', err);
          wx.showToast({
            title: '加载失败',
            icon: 'none',
            duration: 2000
          });
        });
      })
      .catch(err => {
        wx.hideLoading();
        console.error('加载产品失败:', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none',
          duration: 2000
        });
      });
  },

  // 根据dk_id列表查询物料，返回MaterialsMap
  loadMaterialsByIds(dkIds: number[]): Promise<MaterialsMap> {
    return new Promise((resolve, reject) => {
      if (!dkIds || dkIds.length === 0) {
        console.warn('物料ID列表为空');
        resolve({});
        return;
      }

      const db = wx.cloud.database();
      
      console.log('开始查询物料，dkIds:', dkIds);
      
      // 逐个查询物料（符合微信小程序标准）
      // 确保所有 dkId 都是 number 类型
      const promises = dkIds.map((dkId, index) => {
        // 确保 dkId 是 number 类型
        const dkIdNum = typeof dkId === 'string' ? parseInt(dkId, 10) : Number(dkId);
        
        if (isNaN(dkIdNum)) {
          console.warn(`无效的 dk_id: ${dkId}，跳过查询`);
          return Promise.resolve(null);
        }
        
        return db.collection('materials')
          .where({
            dk_id: dkIdNum  // 使用 number 类型查询
          })
          .get()
          .then(res => {
            console.log(`查询物料 ${index + 1}/${dkIds.length}, dk_id=${dkIdNum} (原始值: ${dkId}, 类型: ${typeof dkIdNum}):`, {
              found: res.data && res.data.length > 0,
              dataLength: res.data?.length || 0,
              material: res.data?.[0] ? {
                dk_id: res.data[0].dk_id,
                dk_id_type: typeof res.data[0].dk_id,
                name: res.data[0].name
              } : null
            });
            
            if (res.data && res.data.length > 0) {
              return res.data[0] as Material;
            }
            console.warn(`物料未找到: dk_id = ${dkIdNum}`);
            return null;
          })
          .catch(err => {
            console.error(`查询物料失败: dk_id = ${dkIdNum}`, err);
            return null;
          });
      });

      Promise.all(promises).then(results => {
        // 过滤掉null值并构建Map
        const materials = results.filter(m => m !== null) as Material[];
        
        console.log('物料查询完成:', {
          requested: dkIds.length,
          found: materials.length,
          materials: materials.map(m => ({
            dk_id: m.dk_id,
            name: m.name
          }))
        });
        
        const materialsMap = buildMaterialsMap(materials);
        
        console.log('物料Map构建完成:', {
          mapSize: Object.keys(materialsMap).length,
          mapKeys: Object.keys(materialsMap)
        });
        
        resolve(materialsMap);
      }).catch(err => {
        console.error('Promise.all失败:', err);
        reject(err);
      });
    });
  },

  // 加载物料数据
  loadMaterial(dk_id: string) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    const db = wx.cloud.database();
    const dkIdNum = parseInt(dk_id);
    
    db.collection('materials')
      .where({
        dk_id: dkIdNum
      })
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          const material = res.data[0] as Material;
          const unitPrice = calculateUnitPrice(material);
          this.setData({
            material,
            unitPrice
          });
          wx.hideLoading();
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '物料不存在',
            icon: 'none',
            duration: 2000
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('加载物料失败:', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none',
          duration: 2000
        });
      });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});
