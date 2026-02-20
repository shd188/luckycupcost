// 云函数：搜索产品和物料
const cloud = require('wx-server-sdk')
const { calculateProductCost, buildMaterialsMap } = require('./utils')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { keyword } = event
  
  if (!keyword || !keyword.trim()) {
    return {
      success: false,
      message: '搜索关键词不能为空',
      data: {
        products: [],
        materials: []
      }
    }
  }

  try {
    const keywordLower = keyword.toLowerCase().trim()
    
    // 搜索产品
    const productsResult = await db.collection('products')
      .where({
        name: db.RegExp({
          regexp: keywordLower,
          options: 'i'
        })
      })
      .get()

    // 搜索物料
    const materialsResult = await db.collection('materials')
      .where({
        name: db.RegExp({
          regexp: keywordLower,
          options: 'i'
        })
      })
      .get()

    // 计算物料的单位成本
    const materials = materialsResult.data.map(material => {
      const unitPrice = material.spec_price / material.spec_amount
      return {
        ...material,
        unitPrice: parseFloat(unitPrice.toFixed(4))
      }
    })

    // 获取所有物料用于计算产品成本（分页获取）
    const MAX_LIMIT = 100 // 云数据库单次查询最大限制
    let allMaterials = []
    let skip = 0
    
    // 循环获取所有物料数据
    while (true) {
      const batch = await db.collection('materials')
        .skip(skip)
        .limit(MAX_LIMIT)
        .get()
      
      allMaterials = allMaterials.concat(batch.data)
      
      // 如果返回的数据量小于限制数，说明已获取完所有数据
      if (batch.data.length < MAX_LIMIT) {
        break
      }
      
      skip += MAX_LIMIT
    }
    
    // 构建物料Map（使用统一的工具函数）
    const materialsMap = buildMaterialsMap(allMaterials)
    
    console.log(`已加载 ${allMaterials.length} 条物料数据用于成本计算`)

    // 计算每个产品的总成本（使用统一的计算函数）
    const products = productsResult.data.map(product => {
      const costInfo = calculateProductCost(product, materialsMap)
      
      return {
        ...product,
        totalCost: costInfo.totalCost
      }
    })

    return {
      success: true,
      data: {
        products: products,
        materials: materials
      }
    }
  } catch (error) {
    console.error('搜索失败:', error)
    return {
      success: false,
      message: '搜索失败，请稍后重试',
      data: {
        products: [],
        materials: []
      }
    }
  }
}

