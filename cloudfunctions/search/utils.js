/**
 * 成本计算工具函数（云函数版本）
 * 与 miniprogram/utils/calculator.ts 保持逻辑一致
 */

/**
 * 计算物料单位成本
 */
function calculateUnitPrice(material) {
  return parseFloat((material.spec_price / material.spec_amount).toFixed(4));
}

/**
 * 计算产品总成本
 */
function calculateProductCost(product, materialsMap) {
  let totalCost = 0;
  const details = [];

  if (!product.recipe || !Array.isArray(product.recipe)) {
    return {
      totalCost: 0,
      details: []
    };
  }

  product.recipe.forEach((recipeItem, index) => {
    // 查找物料（通过dk_id，都是number类型）
    const dkId = recipeItem.material_dk_id;
    
    // 确保 dkId 是有效的 number
    if (dkId === undefined || dkId === null || isNaN(Number(dkId))) {
      console.warn(`无效的 material_dk_id: ${dkId}`, {
        productName: product.name,
        recipeIndex: index,
        recipeItem
      });
      return;
    }
    
    const material = materialsMap[dkId];
    
    if (!material) {
      console.warn(`物料未找到: material_dk_id = ${dkId}`, {
        productName: product.name,
        recipeIndex: index,
        recipeItem
      });
      return;
    }

    // 计算单位成本
    const unitPrice = calculateUnitPrice(material);

    // 计算该项成本
    const itemCost = recipeItem.amount * unitPrice;

    // 累加（不管category是什么，都要计算）
    totalCost += itemCost;

    // 记录明细（包含category信息，原料和包装都要记录）
    details.push({
      materialName: material.name,
      amount: recipeItem.amount,
      unit: material.spec_unit,
      unitPrice: unitPrice,
      itemCost: parseFloat(itemCost.toFixed(2)),
      category: material.category
    });
  });

  return {
    totalCost: parseFloat(totalCost.toFixed(2)),
    details: details
  };
}

/**
 * 将物料数组转换为 Map，提高查找效率
 */
function buildMaterialsMap(materials) {
  const map = {};
  materials.forEach(material => {
    // 检查material是否存在且有dk_id
    if (material && material.dk_id !== undefined && material.dk_id !== null) {
      // 直接使用dk_id作为key（dk_id是number类型）
      map[material.dk_id] = material;
    } else {
      console.warn('无效的物料数据:', material);
    }
  });
  return map;
}

module.exports = {
  calculateUnitPrice,
  calculateProductCost,
  buildMaterialsMap
};

